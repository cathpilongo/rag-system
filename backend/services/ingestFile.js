import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { pool } from '../db/pool.js';
import { embedText } from './geminiClient.js';
import { getCollection, upsertChunk } from './chromaClient.js';

const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 500);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 80);

function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks.filter(Boolean);
}

function readRows(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const raw = fs.readFileSync(filePath, 'utf8');
    return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  }
  if (ext === '.xlsx' || ext === '.xls') {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }
  throw new Error('Supported formats: .csv, .xlsx');
}

function mapRow(row) {
  const docTitle = row.doc_title ?? row.docTitle ?? row.topic ?? '';
  return {
    chunk_id: row.chunk_id ?? row.chunkId ?? '',
    source: row.source ?? row.source_type ?? row.sourceType ?? '',
    agency: row.agency ?? row.agency_office ?? row.agencyOffice ?? '',
    topic: docTitle,
    doc_title: docTitle,
    original_text: row.original_text ?? row.originalText ?? '',
    localized_text: row.localized_text ?? row.localizedText ?? '',
    hazard_type: row.hazard_type ?? row.hazardType ?? 'All_Hazards',
    phase: row.phase ?? 'All_Phases',
    validation_status: row.validation_status ?? row.validationStatus ?? 'Approved',
  };
}

async function savePostgresRow(client, mapped, chunkId, chunkBody) {
  await client.query(
    `INSERT INTO drrm_repository
      (chunk_id, source, agency, topic, original_text, localized_text, hazard_type, phase, validation_status, doc_title)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (chunk_id) DO UPDATE SET
      source = EXCLUDED.source,
      agency = EXCLUDED.agency,
      topic = EXCLUDED.topic,
      original_text = EXCLUDED.original_text,
      localized_text = EXCLUDED.localized_text,
      hazard_type = EXCLUDED.hazard_type,
      phase = EXCLUDED.phase,
      validation_status = EXCLUDED.validation_status,
      doc_title = EXCLUDED.doc_title`,
    [
      chunkId,
      mapped.source || null,
      mapped.agency || null,
      mapped.topic || null,
      chunkBody,
      mapped.localized_text || null,
      mapped.hazard_type || null,
      mapped.phase || null,
      mapped.validation_status || 'Approved',
      mapped.doc_title || null,
    ]
  );
}

export async function ingestFile(filePath) {
  const rows = readRows(filePath);
  await getCollection();
  const client = await pool.connect();
  let count = 0;

  try {
    for (const row of rows) {
      const mapped = mapRow(row);
      const body = [mapped.localized_text, mapped.original_text].filter(Boolean).join('\n\n');
      if (!body) continue;

      const baseId = String(mapped.chunk_id || '').trim() || `ROW_${Date.now()}`;
      const parts = chunkText(body);

      for (let i = 0; i < parts.length; i++) {
        const chunkId = parts.length === 1 ? baseId : `${baseId}_${i + 1}`;
        await savePostgresRow(client, mapped, chunkId, parts[i]);
        const embedding = await embedText(parts[i]);
        await upsertChunk({
          chunkId,
          embedding,
          document: parts[i],
          metadata: {
            chunk_id: chunkId,
            source: mapped.source || '',
            agency: mapped.agency || '',
            topic: mapped.topic || '',
          },
        });
        count++;
      }
    }
  } finally {
    client.release();
  }
  return { count };
}
