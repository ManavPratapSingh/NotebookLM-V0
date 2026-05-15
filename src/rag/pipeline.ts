import * as dotenv from "dotenv";
dotenv.config();

const API_KEY: string | undefined = process.env.OPENROUTER_API_KEY;
if (!API_KEY) throw new Error("API Key not found");

import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import type { Document } from "@langchain/core/documents";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { client } from "../Qdrant.config.js";

const getEmbeddings = (): OpenAIEmbeddings => new OpenAIEmbeddings({
    openAIApiKey: API_KEY,
    modelName: "text-embedding-3-small",
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
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

    // Keep only docs whose embedding has the expected dimension (1536 for text-embedding-3-small)
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

    if (validPairs.length === 0) {
        throw new Error("No documents produced valid embeddings");
    }

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

    const genai: GoogleGenAI = new GoogleGenAI({
        apiKey: API_KEY,
    })

    const response: GenerateContentResponse = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { role: "user", parts: [{ text: userQuery }] }
        ],
        config : {
            systemInstruction: system_prompt,
        }
    })

    return response.text;
}

export const queryPipeline = async (userQuery: string) => {
    const retrievedChunks: Document[] = await retrieval(userQuery);
    const finalResponse: string | undefined = await generation(retrievedChunks, userQuery);

    if (!finalResponse) {
        return "Sorry, I couldn't find any relevant information in the document.";
    }

    return finalResponse;
}
