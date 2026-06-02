const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL || "http://localhost:3001";

export async function processQuery(userQuery, sessionId) {
  const res = await fetch(`${LOCAL_API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userQuery, sessionId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || "Local RAG request failed");
  }

  return {
    response: data.answer,
    isFallback: data.isFallback,
    chunkIds: data.chunkIds || "",
    topics: data.topics || "",
    sources: data.sources || [],
    latencyMs: data.latencyMs,
  };
}

export async function loadChatHistory(sessionId) {
  const res = await fetch(`${LOCAL_API_URL}/api/history/${sessionId}`);
  if (!res.ok) return [];
  return res.json();
}
