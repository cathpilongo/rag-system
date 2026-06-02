const API_KEY = process.env.GEMINI_API_KEY;
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

function requireKey() {
  if (!API_KEY?.trim()) {
    throw new Error('GEMINI_API_KEY is not set in backend/.env');
  }
}

export async function embedText(
  text,
  model = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001'
) {
  requireKey();
  const res = await fetch(`${BASE}/models/${model}:embedContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini embeddings failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding?.values ?? [];
}

export async function generateChat({
  system,
  user,
  model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
}) {
  requireKey();
  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini chat failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join('')
      .trim() ?? ''
  );
}
