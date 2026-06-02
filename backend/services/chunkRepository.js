import { pool } from '../db/pool.js';
import { embedText } from './geminiClient.js';
import { getCollection, upsertChunk } from './chromaClient.js';

export function rowToChunk(row) {
  return {
    id: row.id,
    chunk_id: row.chunk_id,
    source_type: row.source_type || row.source || 'Other',
    agency_office: row.agency_office || row.agency || '',
    doc_title: row.doc_title || row.topic || '',
    doc_year: row.doc_year || '',
    page_section: row.page_section || '',
    hazard_type: row.hazard_type || 'All_Hazards',
    phase: row.phase || 'All_Phases',
    original_text: row.original_text || '',
    localized_text: row.localized_text || '',
    format_type: row.format_type || 'instruction',
    priority: row.priority || 'Medium',
    validation_status: row.validation_status || 'Pending',
    source_url: row.source_url || '',
    date_accessed: row.date_accessed || '',
    notes: row.notes || '',
    created_date: row.created_at,
  };
}

export function buildChunkIdPrefix(hazardType, phase) {
  const h = (hazardType || 'All_Hazards').replace(/\s+/g, '_').toUpperCase();
  const p = (phase || 'All_Phases').replace(/\s+/g, '_').toUpperCase();
  return `${h}_${p}_`;
}

export async function generateNextChunkId(hazardType, phase) {
  const prefix = buildChunkIdPrefix(hazardType, phase);
  const { rows } = await pool.query(
    `SELECT chunk_id FROM drrm_repository WHERE chunk_id ILIKE $1`,
    [`${prefix}%`]
  );
  let maxNum = 0;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}(\\d+)$`, 'i');
  for (const row of rows) {
    const m = row.chunk_id?.match(re);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  const next = maxNum + 1;
  const suffix = next >= 100 ? String(next) : String(next).padStart(2, '0');
  return `${prefix}${suffix}`;
}

function formToDb(data) {
  return {
    chunk_id: data.chunk_id?.trim(),
    source: data.source_type || data.source || null,
    agency: data.agency_office || data.agency || null,
    source_type: data.source_type || null,
    agency_office: data.agency_office || null,
    doc_title: data.doc_title || data.topic || null,
    doc_year: data.doc_year || null,
    page_section: data.page_section || null,
    topic: data.doc_title || data.topic || null,
    hazard_type: data.hazard_type || null,
    phase: data.phase || null,
    original_text: data.original_text || '',
    localized_text: data.localized_text || null,
    format_type: data.format_type || null,
    priority: data.priority || 'Medium',
    validation_status: data.validation_status || 'Pending',
    source_url: data.source_url || null,
    date_accessed: data.date_accessed || null,
    notes: data.notes || null,
  };
}

async function syncVector(chunkId, text, metadata) {
  const body = text?.trim();
  if (!body) return;
  const embedding = await embedText(body);
  await upsertChunk({
    chunkId,
    embedding,
    document: body,
    metadata,
  });
}

export async function listChunks() {
  const { rows } = await pool.query(
    `SELECT * FROM drrm_repository ORDER BY created_at DESC`
  );
  return rows.map(rowToChunk);
}

export async function getChunkById(id) {
  const { rows } = await pool.query(`SELECT * FROM drrm_repository WHERE id = $1`, [id]);
  return rows[0] ? rowToChunk(rows[0]) : null;
}

export async function createChunk(data) {
  const d = formToDb(data);
  if (!d.chunk_id) {
    d.chunk_id = await generateNextChunkId(d.hazard_type, d.phase);
  }
  if (!d.localized_text && !d.original_text) {
    throw new Error('localized_text or original_text is required');
  }

  const { rows } = await pool.query(
    `INSERT INTO drrm_repository
      (chunk_id, source, agency, topic, original_text, localized_text, hazard_type, phase, validation_status,
       source_type, agency_office, doc_title, doc_year, page_section, format_type, priority, source_url, date_accessed, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [
      d.chunk_id,
      d.source,
      d.agency,
      d.topic,
      d.original_text,
      d.localized_text,
      d.hazard_type,
      d.phase,
      d.validation_status,
      d.source_type,
      d.agency_office,
      d.doc_title,
      d.doc_year,
      d.page_section,
      d.format_type,
      d.priority,
      d.source_url,
      d.date_accessed,
      d.notes,
    ]
  );

  const chunk = rowToChunk(rows[0]);
  const embedTextBody = [d.localized_text, d.original_text].filter(Boolean).join('\n\n');
  await syncVector(d.chunk_id, embedTextBody, {
    chunk_id: d.chunk_id,
    source: d.source || '',
    agency: d.agency || '',
    topic: d.topic || '',
  });
  return chunk;
}

export async function updateChunk(id, data) {
  const existing = await getChunkById(id);
  if (!existing) throw new Error('Chunk not found');

  const d = formToDb({ ...existing, ...data });
  const { rows } = await pool.query(
    `UPDATE drrm_repository SET
      chunk_id = $2, source = $3, agency = $4, topic = $5, original_text = $6, localized_text = $7,
      hazard_type = $8, phase = $9, validation_status = $10,
      source_type = $11, agency_office = $12, doc_title = $13, doc_year = $14, page_section = $15,
      format_type = $16, priority = $17, source_url = $18, date_accessed = $19, notes = $20
     WHERE id = $1 RETURNING *`,
    [
      id,
      d.chunk_id,
      d.source,
      d.agency,
      d.topic,
      d.original_text,
      d.localized_text,
      d.hazard_type,
      d.phase,
      d.validation_status,
      d.source_type,
      d.agency_office,
      d.doc_title,
      d.doc_year,
      d.page_section,
      d.format_type,
      d.priority,
      d.source_url,
      d.date_accessed,
      d.notes,
    ]
  );

  const chunk = rowToChunk(rows[0]);
  const embedTextBody = [d.localized_text, d.original_text].filter(Boolean).join('\n\n');
  await syncVector(d.chunk_id, embedTextBody, {
    chunk_id: d.chunk_id,
    source: d.source || '',
    agency: d.agency || '',
    topic: d.topic || '',
  });
  return chunk;
}

export async function deleteChunk(id) {
  const existing = await getChunkById(id);
  if (!existing) throw new Error('Chunk not found');

  await pool.query(`DELETE FROM drrm_repository WHERE id = $1`, [id]);

  try {
    const collection = await getCollection();
    await collection.delete({ ids: [existing.chunk_id] });
  } catch {
    // Chroma entry may not exist
  }
  return { ok: true };
}

export async function listChatLogs() {
  const { rows } = await pool.query(
    `SELECT id, session_id, user_query, assistant_response, retrieved_chunk_ids,
            retrieved_topics, is_fallback, created_at
     FROM chat_logs ORDER BY created_at DESC LIMIT 200`
  );
  return rows.map((r) => ({
    id: r.id,
    session_id: r.session_id,
    user_query: r.user_query,
    bot_response: r.assistant_response,
    retrieved_chunk_ids: r.retrieved_chunk_ids,
    retrieved_topics: r.retrieved_topics,
    is_fallback: r.is_fallback,
    created_date: r.created_at,
  }));
}

export async function clearChatLogs() {
  const { rowCount } = await pool.query(`DELETE FROM chat_logs`);
  return { deleted: rowCount };
}
