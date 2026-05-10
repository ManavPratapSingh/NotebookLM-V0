import * as dotenv from "dotenv";
dotenv.config();

const API_KEY : string | undefined = process.env.QDRANT_API_KEY;
if (!API_KEY) throw new Error("QDRANT_API_KEY not found");

const URL : string | undefined = process.env.QDRANT_URL;
if (!URL) throw new Error("QDRANT_URL not found");

import { QdrantClient } from '@qdrant/js-client-rest';

export const client = new QdrantClient({
    url: URL,
    apiKey: API_KEY,
});

// Optional: Initialization check
client.getCollections()
    .then(result => console.log('Qdrant connected. Collections:', result.collections.map(c => c.name)))
    .catch(err => console.error('Qdrant connection failed:', err));
