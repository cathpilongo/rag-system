const BASE = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api/admin${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || `Request failed (${res.status})`);
  return data;
}

export function listChunks() {
  return request('/chunks');
}

export function getNextChunkId(hazardType, phase) {
  const params = new URLSearchParams({
    hazard_type: hazardType || 'All_Hazards',
    phase: phase || 'All_Phases',
  });
  return request(`/chunks/next-id?${params}`);
}

export function createChunk(data) {
  return request('/chunks', { method: 'POST', body: JSON.stringify(data) });
}

export function updateChunk(id, data) {
  return request(`/chunks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteChunk(id) {
  return request(`/chunks/${id}`, { method: 'DELETE' });
}

export async function listChatLogs() {
  const data = await request('/logs');
  return data.logs || [];
}

export function clearChatLogs() {
  return request('/logs', { method: 'DELETE' });
}

export async function importFile(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const contentBase64 = btoa(binary);
  return request('/import-data', {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentBase64 }),
  });
}

export async function parseAdvisory(payload) {
  const data = await request('/parse-advisory', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.chunks || [];
}

export async function bulkCreateChunks(chunks) {
  const created = [];
  for (const chunk of chunks) {
    created.push(await createChunk(chunk));
  }
  return created;
}
