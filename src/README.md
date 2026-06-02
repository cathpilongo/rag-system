# BisayaSafe: Localized Cebuano–English DRRM Chatbot

A web-based disaster risk reduction and management (DRRM) chatbot that provides localized Cebuano–English guidance to communities in the Visayas region of the Philippines.

---

## Overview

BisayaSafe is a research prototype developed as part of an undergraduate thesis. It uses a **Retrieval-Augmented Generation (RAG)** architecture with **semantic vector search** to deliver context-aware, localized disaster preparedness and response information.

The system addresses the language gap in DRRM communication by providing guidance in Cebuano — the primary language spoken by millions of Filipinos in the Visayas and Mindanao regions — alongside English.

---

## Features

- **Bilingual Chatbot Interface** — Responds in Cebuano–English mixed language (code-switching)
- **RAG-Based Knowledge Retrieval** — Semantic search over approved DRRM chunks (Chroma + embeddings)
- **Multi-Hazard Coverage** — Covers Flood, Typhoon, Storm Surge, Earthquake, Fire, Landslide, and Volcanic hazards
- **Disaster Phase Guidance** — Chunks tagged with Before, During, and After phases
- **MDRRMO Staff Dashboard** — For validating and managing knowledge base content
- **Advisory Ingestor** — LLM-powered tool for parsing and ingesting official DRRM advisories
- **Chat Interaction Logging** — Logs user queries and bot responses for evaluation and improvement

---

## System Architecture (Current Implementation)

```
User Query
    │
    ▼
Query Embedding (Gemini — gemini-embedding-001)
    │
    ▼
Vector Retrieval (Chroma — cosine similarity, Top K)
    │
    ▼
Postgres Filter (validation_status = Approved only)
    │
    ▼
Retrieved chunks injected as LLM context
    │
    ▼
Response Generation (Gemini — gemini-2.0-flash)
    │
    ▼
Localized Cebuano–English Response
```

**Key files:** `backend/services/ragService.js`, `backend/services/chromaClient.js`, `backend/services/geminiClient.js`

---

## Earlier Thesis Diagram vs Current Stack

An earlier design diagram described **rule-based keyword matching** (hazard + phase) and **simple SQL filtering** without cosine similarity, plus a **cloud LLM (GPT via Base44)**.

The **local stack currently running** differs as follows:

| Earlier diagram | Current implementation |
|-----------------|------------------------|
| Rule-based keyword → hazard + phase | Semantic embedding of the full query |
| SQL filter: `hazard_type + phase + Approved` | Chroma vector search, then `Approved` filter in Postgres |
| Simple filtering (no cosine similarity) | **Cosine similarity** in Chroma (`hnsw:space: cosine`) |
| Cloud GPT (Base44 InvokeLLM) | **Google Gemini** (`gemini-2.0-flash`) |

Only **`Approved`** chunks are used in chat. **Pending**, **For_Local_Validation**, and **Rejected** chunks are excluded from retrieval.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui |
| **Backend API** | Node.js / Express (`backend/`) |
| **Database** | PostgreSQL (`drrm_repository`, `chat_logs`) |
| **Vector Store** | ChromaDB (cosine similarity) |
| **Embeddings** | Google Gemini — `gemini-embedding-001` |
| **LLM (chat + advisory parse)** | Google Gemini — `gemini-2.0-flash` |
| **Legacy / optional** | Base44 entities & serverless functions under `base44/` |

### Run locally

```cmd
npm run docker:up
npm run backend
npm run dev
```

Configure `backend/.env` (see `backend/.env.example`). Requires a `GEMINI_API_KEY` from Google AI Studio.

---

## Project Structure

```
├── src/
│   ├── pages/
│   │   ├── Chat.jsx              # Main chatbot interface
│   │   ├── Admin.jsx             # Knowledge base & logs management
│   │   ├── Dashboard.jsx         # MDRRMO staff validation dashboard
│   │   └── AdvisoryIngestor.jsx  # LLM-powered advisory ingestion
│   ├── components/               # UI components (chat, admin, dashboard)
│   └── lib/
│       └── ragService.js         # Frontend client → POST /api/chat
├── backend/
│   ├── services/
│   │   ├── ragService.js         # RAG pipeline (embed → Chroma → filter → LLM)
│   │   ├── chromaClient.js       # Vector store
│   │   ├── geminiClient.js       # Embeddings + chat (Gemini API)
│   │   └── chunkRepository.js    # Postgres CRUD
│   └── routes/admin.js           # Chunks API + parse-advisory
├── base44/                       # Original Base44 export (optional)
└── data/                         # CSV/Excel for bulk ingest
```

---

## Knowledge Base (DRRMChunk)

The knowledge base consists of structured content chunks sourced from official DRRM agencies:

- **PAGASA** — Weather and typhoon advisories
- **NDRRMC** — National disaster risk reduction guidelines
- **DILG** — Local government unit directives
- **OCD** — Office of Civil Defense protocols
- **LGU/MDRRMO** — Local barangay-level DRRM information

Each chunk is tagged with:

- `hazard_type` — Type of disaster (Flood, Typhoon, Earthquake, etc.)
- `phase` — Disaster timeline (Before, During, After)
- `format_type` — Content format (instruction, checklist, warning, hotline, etc.)
- `validation_status` — `Pending`, `For_Local_Validation`, `Approved`, or `Rejected`
- `localized_text` — Cebuano–English version for chatbot delivery

### Validation workflow

| Status | Meaning | Used in chat? |
|--------|---------|---------------|
| **Pending** | New / not yet reviewed | No |
| **For_Local_Validation** | Needs local (barangay/LGU) verification | No |
| **Approved** | Cleared for public use | **Yes** |
| **Rejected** | Not suitable for the knowledge base | No |

---

## Security

- Only **`Approved`** chunks are retrievable by the chatbot (`ragService.js` Postgres filter)
- Admin UI pages are PIN-protected
- Base44 RLS policies apply only when using the Base44-hosted stack

---

## Thesis Information

| | |
|---|---|
| **Title** | BisayaSafe: Development of a Localized Cebuano–English Disaster Risk Reduction and Management Chatbot |
| **Type** | Undergraduate Thesis |
| **Domain** | Natural Language Processing, Disaster Risk Management, Low-Resource Language AI |
| **Language Focus** | Cebuano (Bisaya) — spoken by ~20 million Filipinos |

---

## Disclaimer

BisayaSafe is a **research prototype** intended for academic purposes. It is not a replacement for official DRRM hotlines or emergency services. In case of emergency, always contact your local MDRRMO, NDRRMC, or dial **911**.
