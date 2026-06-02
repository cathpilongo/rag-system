import { pool } from '../db/pool.js';
import { embedText, generateChat } from './geminiClient.js';

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
import { querySimilar } from './chromaClient.js';

const SYSTEM_PROMPT = `You are a local DRRM assistant named BisayaSafe. Answer the resident's query strictly using the provided context. Respond in the same language style used by the user: if the user asks in Cebuano, respond primarily in Cebuano with natural English terms when appropriate; if the user asks in English, respond in clear English; if the user asks in mixed Cebuano-English, respond in mixed Cebuano-English. Use short, clear steps when giving safety guidance. Do NOT invent hotlines, evacuation centers, or live alerts. If the answer cannot be found in the provided DRRM passages, politely state that you cannot answer based on the current approved DRRM repository and direct them to the Barangay, MDRRMO, PAGASA, or NDRRMC.`;

const FALLBACK_MESSAGE = `Pasensya, ang imong pangutana wala sa kasamtangang scope sa approved DRRM knowledge repository. Kini nga chatbot para lamang sa disaster-related questions sama sa baha, bagyo, evacuation, emergency hotlines, go-bag, ug weather alerts. Palihug kontaka ang inyong Barangay o MDRRMO, o tawag 911 kung emergency. Sunda ang opisyal nga pahibalo gikan sa Barangay, MDRRMO, PAGASA, ug NDRRMC.`;

const SAFETY_REMINDER = `\n\n---\n⚠️ Reminder: Kini research prototype lamang. Sunda gihapon ang opisyal nga instruksyon sa Barangay, MDRRMO, PAGASA, ug NDRRMC.`;

const MAX_COSINE_DISTANCE = Number(process.env.MAX_COSINE_DISTANCE || 0.55);

const REFUSAL_PATTERNS = [
  'wala koy klarong impormasyon',
  'wala sa among official',
  'wala sa akong drrm',
  'wala sa provided',
  'cannot answer',
  'cannot be found',
  'not found in the provided',
  'not in our official',
  'dili bahin sa',
  'wala ko makita sa',
  'pasayloa ko, apan wala',
  'pasensya, wala',
];

function buildContext(passages) {
  return passages
    .map(
      (p, i) =>
        `[${i + 1}] chunk_id: ${p.chunk_id} | topic: ${p.topic || 'N/A'} | agency: ${p.agency || 'N/A'}\n${p.text}`
    )
    .join('\n\n');
}

function isRefusalAnswer(answer) {
  if (!answer?.trim()) return true;
  const normalized = answer.toLowerCase();
  return REFUSAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function isRetrievalRelevant(chromaResult) {
  const bestDistance = chromaResult.distances?.[0]?.[0];
  if (bestDistance == null) return false;
  return bestDistance <= MAX_COSINE_DISTANCE;
}

async function checkDrrmScope(userQuery) {
  const result = await generateChat({
    system:
      'You classify user questions for a Philippine DRRM chatbot. Reply with ONLY "yes" or "no".',
    user: `Is this question about disaster risk reduction, emergency preparedness, typhoons, floods, earthquakes, fire, evacuation, go-bags, rainfall warnings, barangay/MDRRMO response, or other DRRM safety topics in the Philippines?

Question: ${userQuery}

Answer only yes or no.`,
  });
  return result.trim().toLowerCase().startsWith('y');
}

async function recordFallback({ sessionId, userQuery, started, chunkIds = '', topics = '' }) {
  const latencyMs = Date.now() - started;
  const response = FALLBACK_MESSAGE + SAFETY_REMINDER;
  await pool.query(
    `INSERT INTO chat_logs
      (session_id, user_query, retrieved_chunk_ids, assistant_response, retrieved_topics, is_fallback, model_name, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [sessionId, userQuery, chunkIds, response, topics, true, CHAT_MODEL, latencyMs]
  );
  return {
    response,
    isFallback: true,
    chunkIds,
    topics,
    sources: [],
    latencyMs,
  };
}

export async function handleChat({ sessionId, userQuery }) {
  const started = Date.now();
  const [queryEmbedding, inScope] = await Promise.all([
    embedText(userQuery),
    checkDrrmScope(userQuery),
  ]);

  if (!inScope) {
    return recordFallback({ sessionId, userQuery, started });
  }

  const chromaResult = await querySimilar(queryEmbedding);
  const chunkIds = chromaResult.ids?.[0] ?? [];

  if (chunkIds.length === 0 || !isRetrievalRelevant(chromaResult)) {
    return recordFallback({ sessionId, userQuery, started });
  }

  const { rows } = await pool.query(
    `SELECT chunk_id, source, agency, topic, doc_title, original_text, localized_text, hazard_type
     FROM drrm_repository
     WHERE chunk_id = ANY($1::text[])
       AND (validation_status IS NULL OR validation_status = 'Approved')`,
    [chunkIds]
  );

  const byId = Object.fromEntries(rows.map((r) => [r.chunk_id, r]));
  const passages = chunkIds
    .map((id) => byId[id])
    .filter(Boolean)
    .map((r) => ({
      chunk_id: r.chunk_id,
      topic: r.doc_title || r.topic || r.hazard_type,
      agency: r.agency,
      text: [r.localized_text, r.original_text].filter(Boolean).join('\n'),
    }));

  if (passages.length === 0) {
    return recordFallback({ sessionId, userQuery, started });
  }

  const context = buildContext(passages);
  const userPrompt = `Context:\n${context}\n\nResident question:\n${userQuery}`;
  const answer = await generateChat({ system: SYSTEM_PROMPT, user: userPrompt });
  const chunkIdsStr = passages.map((p) => p.chunk_id).join(', ');
  const topics = [...new Set(passages.map((p) => p.topic).filter(Boolean))].join(', ');

  if (isRefusalAnswer(answer)) {
    return recordFallback({ sessionId, userQuery, started });
  }

  const finalResponse = answer + SAFETY_REMINDER;
  const latencyMs = Date.now() - started;

  await pool.query(
    `INSERT INTO chat_logs
      (session_id, user_query, retrieved_chunk_ids, assistant_response, retrieved_topics, is_fallback, model_name, latency_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      sessionId,
      userQuery,
      chunkIdsStr,
      finalResponse,
      topics,
      false,
      CHAT_MODEL,
      latencyMs,
    ]
  );

  return {
    response: finalResponse,
    isFallback: false,
    chunkIds: chunkIdsStr,
    topics,
    sources: passages.map((p) => ({
      chunk_id: p.chunk_id,
      topic: p.topic,
      agency: p.agency,
    })),
    latencyMs,
  };
}
