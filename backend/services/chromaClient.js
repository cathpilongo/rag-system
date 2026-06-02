import { ChromaClient } from 'chromadb';

const host = process.env.CHROMA_HOST || 'localhost';
const port = Number(process.env.CHROMA_PORT || 8000);
const collectionName = process.env.CHROMA_COLLECTION || 'drrm_chunks';

let collectionPromise;

export async function getCollection() {
  if (!collectionPromise) {
    const client = new ChromaClient({ path: `http://${host}:${port}` });
    collectionPromise = client.getOrCreateCollection({
      name: collectionName,
      metadata: { 'hnsw:space': 'cosine' },
    });
  }
  return collectionPromise;
}

export async function upsertChunk({ chunkId, embedding, document, metadata }) {
  const collection = await getCollection();
  await collection.upsert({
    ids: [chunkId],
    embeddings: [embedding],
    documents: [document],
    metadatas: [metadata],
  });
}

export async function deleteChunk(chunkId) {
  const collection = await getCollection();
  await collection.delete({ ids: [chunkId] });
}

export async function querySimilar(embedding, topK = Number(process.env.TOP_K || 5)) {
  const collection = await getCollection();
  return collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    include: ['metadatas', 'documents', 'distances'],
  });
}
