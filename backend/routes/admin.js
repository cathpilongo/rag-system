import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  listChunks,
  createChunk,
  updateChunk,
  deleteChunk,
  generateNextChunkId,
  listChatLogs,
  clearChatLogs,
} from '../services/chunkRepository.js';
import { ingestFile } from '../services/ingestFile.js';
import { generateChat } from '../services/geminiClient.js';

const router = Router();

router.get('/chunks', async (_req, res) => {
  try {
    res.json(await listChunks());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/chunks/next-id', async (req, res) => {
  try {
    const { hazard_type, phase } = req.query;
    const chunk_id = await generateNextChunkId(hazard_type, phase);
    res.json({ chunk_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chunks', async (req, res) => {
  try {
    const chunk = await createChunk(req.body);
    res.status(201).json(chunk);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/chunks/:id', async (req, res) => {
  try {
    const chunk = await updateChunk(Number(req.params.id), req.body);
    res.json(chunk);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/chunks/:id', async (req, res) => {
  try {
    await deleteChunk(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/logs', async (_req, res) => {
  try {
    const logs = await listChatLogs();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/logs', async (_req, res) => {
  try {
    const result = await clearChatLogs();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import', async (req, res) => {
  const { filePath, fileName } = req.body;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'filePath required (server-side path)' });
  }
  try {
    const result = await ingestFile(filePath);
    res.json({ success: true, count: result.count, fileName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multipart-free: client sends base64 file in JSON (prototype-friendly)
router.post('/import-data', async (req, res) => {
  const { fileName, contentBase64 } = req.body;
  if (!contentBase64) {
    return res.status(400).json({ error: 'contentBase64 required' });
  }
  const ext = path.extname(fileName || '.csv').toLowerCase() || '.csv';
  const tmpPath = path.join(os.tmpdir(), `bisayasafe-import-${Date.now()}${ext}`);
  try {
    fs.writeFileSync(tmpPath, Buffer.from(contentBase64, 'base64'));
    const result = await ingestFile(tmpPath);
    res.json({ success: true, count: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
});

router.post('/parse-advisory', async (req, res) => {
  const { advisoryText, sourceType, hazardHint, docTitle, sourceUrl } = req.body;
  if (!advisoryText?.trim()) {
    return res.status(400).json({ error: 'advisoryText is required' });
  }

  try {
    const raw = await generateChat({
      system:
        'You are a DRRM knowledge assistant. Respond with ONLY a valid JSON array, no markdown.',
      user: `Parse this official DRRM advisory into 1-5 knowledge chunks for a Cebuano-English chatbot.

Source Type: ${sourceType || 'PAGASA'}
Hazard: ${hazardHint || 'All_Hazards'}
Document: ${docTitle || 'Advisory'}
URL: ${sourceUrl || ''}

Each chunk object must have: chunk_id, source_type, agency_office, hazard_type, phase, original_text, localized_text, format_type, priority, validation_status (use "Pending").

localized_text must be simple Cebuano-English for barangay residents.

ADVISORY:
${advisoryText}`,
    });

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
    res.json({ chunks: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
