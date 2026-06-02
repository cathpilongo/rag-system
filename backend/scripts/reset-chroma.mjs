import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';

dotenv.config();

const host = process.env.CHROMA_HOST || 'localhost';
const port = Number(process.env.CHROMA_PORT || 8000);
const collectionName = process.env.CHROMA_COLLECTION || 'drrm_chunks';

const client = new ChromaClient({ path: `http://${host}:${port}` });

try {
  await client.deleteCollection({ name: collectionName });
  console.log(`Deleted collection: ${collectionName}`);
} catch (err) {
  if (err.message?.includes('does not exist') || err.message?.includes('not found')) {
    console.log(`Collection ${collectionName} not found (already clean).`);
  } else {
    throw err;
  }
}

console.log('Chroma reset complete. Run ingest next.');
