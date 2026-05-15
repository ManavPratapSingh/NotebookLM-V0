import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY: string | undefined = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("GEMINI_API_KEY not found");

import OpenAI from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import type { Document } from "@langchain/core/documents";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { client } from "../Qdrant.config.js";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const getEmbeddings = (): OpenAIEmbeddings => new OpenAIEmbeddings({
    openAIApiKey: API_KEY,
    modelName: "gemini-embedding-001",
    configuration: {
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    },
});

export const indexing = async (filepath: string) => {
    const loader: PDFLoader = new PDFLoader(filepath);
    const docs: Document[] = await loader.load();

    const embeddings: OpenAIEmbeddings = getEmbeddings();

    const vectorStore: QdrantVectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
        client,
        collectionName: "NotebookLM-vectorspace"
    });

    console.log("Indexing completed");

}

export const csvIndexing = async (filepath: string) => {
    const loader: CSVLoader = new CSVLoader(filepath);
    const rawDocs: Document[] = await loader.load();

    // Filter out empty documents (blank rows / trailing newlines in CSV)
    const docs: Document[] = rawDocs.filter(doc => doc.pageContent.trim().length > 0);

    console.log(`CSV: Loaded ${rawDocs.length} raw docs, ${docs.length} after filtering empty ones`);

    if (docs.length === 0) {
        throw new Error("CSV file has no valid content to index");
    }

    // Log a sample so we can diagnose content issues
    console.log(`Sample doc[0] pageContent (first 300 chars):\n"${docs[0] && docs[0].pageContent.substring(0, 300)}"`);

    const embeddings: OpenAIEmbeddings = getEmbeddings();

    // Manually embed first so we can inspect & filter 0-dim vectors
    const texts: string[] = docs.map(d => d.pageContent);
    const vectors: number[][] = await embeddings.embedDocuments(texts);

    console.log(`Embedding dimensions per doc: ${vectors.map(v => v.length).join(", ")}`);

    // Keep only docs whose embedding has the expected dimension (768 for text-embedding-004)
    const validPairs: { doc: Document; vector: number[] }[] = [];
    for (let i = 0; i < docs.length; i++) {
        const vec = vectors[i];
        const doc = docs[i];
        if (!vec || !doc) continue;
        if (vec.length > 0) {
            validPairs.push({ doc, vector: vec });
        } else {
            console.warn(`Skipping doc ${i} — embedding returned 0 dimensions. Content: "${doc.pageContent.substring(0, 100)}"`);
        }
    }

    if (validPairs.length === 0) throw new Error("No documents produced valid embeddings");

    const vectorStore: QdrantVectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        client,
        collectionName: "NotebookLM-vectorspace"
    });

    await vectorStore.addVectors(
        validPairs.map(p => p.vector),
        validPairs.map(p => p.doc)
    );

    console.log(`CSV Indexing completed — indexed ${validPairs.length}/${docs.length} documents`);

}

export const retrieval = async (userQuery: string) => {
    const embeddings: OpenAIEmbeddings = getEmbeddings();

    const vectorStore: QdrantVectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        client,
        collectionName: "NotebookLM-vectorspace"
    });

    const retrieval: VectorStoreRetriever = await vectorStore.asRetriever({ k: 3 });

    const searchedChunks: Document[] = await retrieval.invoke(userQuery);

    return searchedChunks;

}

export const generation = async (retrievedDocuments: Document[], userQuery: string) => {
    const system_prompt: string = `You are an AI Assistant who helps resolving the user query based on the avaliable context provided to you from PDF file with the content and page number.


       Rule :
       - Only answer based on the avaliable context from the file only.


       context : ${JSON.stringify(retrievedDocuments)}`

    const openai: OpenAI = new OpenAI({
        apiKey: API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: userQuery },
        ],
    });

    return response.choices[0]?.message?.content ?? undefined;
}

// --- CRAG Implementation ---

const GraphState = Annotation.Root({
    query: Annotation<string>,
    originalQuery: Annotation<string>,
    documents: Annotation<Document[]>,
    retryCount: Annotation<number>,
    isRelevant: Annotation<boolean>,
    finalResponse: Annotation<string | undefined>,
});

const retrieveNode = async (state: typeof GraphState.State) => {
    console.log("--- RETRIEVING ---");
    const docs = await retrieval(state.query);
    return { documents: docs };
}

const graderNode = async (state: typeof GraphState.State) => {
    console.log("--- GRADING DOCUMENTS ---");
    const openai: OpenAI = new OpenAI({
        apiKey: API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: [
            { 
                role: "system", 
                content: "Your only job is to say 'YES' if at least one document helps answer the question, and 'NO' otherwise. Do not explain yourself." 
            },
            { 
                role: "user", 
                content: `Question: ${state.originalQuery}\nDocuments: ${JSON.stringify(state.documents)}` 
            },
        ],
    });

    const grade = response.choices[0]?.message?.content?.trim().toUpperCase();
    console.log("Grade:", grade);
    return { isRelevant: grade === "YES" };
}

const transformNode = async (state: typeof GraphState.State) => {
    console.log("--- TRANSFORMING QUERY ---");
    const openai: OpenAI = new OpenAI({
        apiKey: API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: [
            { 
                role: "system", 
                content: "The previous search failed. Rewrite this query to be more effective for a vector database search. Be concise and focus on keywords." 
            },
            { 
                role: "user", 
                content: `Original query: ${state.originalQuery}` 
            },
        ],
    });

    const newQuery = response.choices[0]?.message?.content?.trim() || state.originalQuery;
    console.log("New Query:", newQuery);
    return { 
        query: newQuery, 
        retryCount: (state.retryCount || 0) + 1 
    };
}

const generateNode = async (state: typeof GraphState.State) => {
    console.log("--- GENERATING ---");
    const response = await generation(state.documents, state.originalQuery);
    return { finalResponse: response };
}

const workflow = new StateGraph(GraphState)
    .addNode("retrieve", retrieveNode)
    .addNode("grade", graderNode)
    .addNode("transformQuery", transformNode)
    .addNode("generate", generateNode)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "grade")
    .addConditionalEdges(
        "grade",
        (state) => {
            if (state.isRelevant) return "generate";
            if ((state.retryCount || 0) < 1) return "rewrite";
            return "stop";
        },
        {
            generate: "generate",
            rewrite: "transformQuery",
            stop: END,
        }
    )
    .addEdge("transformQuery", "retrieve")
    .addEdge("generate", END);

const app = workflow.compile();

export const queryPipeline = async (userQuery: string) => {
    const result = await app.invoke({
        query: userQuery,
        originalQuery: userQuery,
        retryCount: 0,
        documents: [],
    });

    if (!result.finalResponse) {
        return "I'm sorry, I couldn't find relevant information in the internal documents to answer that accurately.";
    }

    return result.finalResponse;
}

