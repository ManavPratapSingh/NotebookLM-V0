import * as dotenv from "dotenv";
dotenv.config();

const API_KEY: string | undefined = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("API Key not found");

import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import type { Document } from "@langchain/core/documents";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";

export const indexing = async (filepath: string) => {
    const loader: PDFLoader = new PDFLoader(filepath);
    const docs: Document[] = await loader.load();

    const embeddings: GoogleGenerativeAIEmbeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: API_KEY,
        model: "gemini-embedding-001",
    });

    const vectorStore: QdrantVectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: "http://localhost:6333",
        collectionName: "NotebookLM-vectorspace"
    });

    console.log("Indexing completed");

}

export const retrieval = async (userQuery: string) => {
    const embeddings: GoogleGenerativeAIEmbeddings = new GoogleGenerativeAIEmbeddings({
        apiKey : API_KEY,
        model: "gemini-embedding-001",
    });

    const vectorStore: QdrantVectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: "http://localhost:6333",
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
