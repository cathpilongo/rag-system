import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleChat } from './services/ragService.js';
import { pool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  })
);
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, mode: 'gemini-rag' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    const result = await handleChat({
      sessionId,
      userQuery: message.trim(),
    });
    res.json({
      sessionId,
      answer: result.response,
      isFallback: result.isFallback,
      chunkIds: result.chunkIds,
      topics: result.topics,
      sources: result.sources,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'RAG pipeline failed', detail: err.message });
  }
});

app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT user_query, assistant_response, retrieved_chunk_ids, retrieved_topics, is_fallback, created_at
       FROM chat_logs WHERE session_id = $1 ORDER BY created_at ASC`,
      [req.params.sessionId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/admin', adminRouter);

const port = Number(process.env.PORT || 3001);

runMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`BisayaSafe local API: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
