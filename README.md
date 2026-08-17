# AIVOA QMS — Pharmaceutical Customer Complaint Copilot

AI-powered **Customer Complaint** module for API and FDF manufacturing QA. Built for the [AIVOA](https://github.com/dedsecpy/Pharmaceuticals-CCMS) Round 1 AI Product Engineer assignment.

The left pane is the official QMS record. The right pane is **Bunny**, an intake assistant that logs, edits, and extracts complaints from prompts or documents, then drafts a GMP-aware risk assessment. QA can also type the form by hand. Save remains a human decision — this is a copilot, not a validated eQMS.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/Agent-LangGraph-1C3C3C)](https://langchain-ai.github.io/langgraph/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2.x-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Groq](https://img.shields.io/badge/LLM-Groq_GPT--OSS_20B-F55036)](https://console.groq.com/)

---

## End-to-end workflow

```mermaid
flowchart LR
  User[User prompt or PDF] --> UI[React Copilot]
  UI --> Redux[Redux Toolkit]
  Redux --> API["FastAPI /api/chat or /api/upload"]
  API --> Graph[LangGraph StateGraph]
  Graph --> Router[intent_router]
  Router --> Log[log_complaint]
  Router --> Edit[edit_complaint]
  Router --> Extract[extract_document]
  Router --> Chat[chat / qa]
  Log --> Enrich[risk_and_quality_enrichment]
  Edit --> Enrich
  Extract --> Enrich
  Enrich --> Dupes[duplicate_scan]
  Dupes --> Reply[compose_assistant_reply]
  Chat --> Reply
  Reply --> Redux
  Redux --> Form[Log Complaint form]
  Redux --> Risk[AI Copilot Risk Assessment]
```

Intake tools (`log_complaint`, `edit_complaint`, `extract_document`) return complaint fields, risk, quality insights, and Bunny’s reply in **one Groq JSON call**. Greetings and off-topic messages route to `chat` / `qa` and do not overwrite the record.

---

## What it does

| Capability | Behaviour |
| --- | --- |
| **Log complaint** | Extracts source, customer, product, batch, dates, quantity, type, and description from free text. |
| **Edit complaint** | Patches only the fields mentioned (“batch is BMX24602”) and preserves the rest. |
| **Extract document** | Parses PDF, DOCX, TXT, or EML (10 MB) and fills the same schema. |
| **Risk assessment** | Severity (Critical / Major / Minor), next action, patient-safety impact, regulatory flag, batch disposition, CAPA, root-cause hypothesis. |
| **Completeness** | Score plus missing intake fields. |
| **Duplicate scan** | Matches saved records on product and batch/lot. |
| **Human edit** | Form fields are editable in Redux; Bunny is not the only writer. |
| **Audit trail** | Each graph run is stored in `audit_events`. |

---

## Architecture

```
frontend/          Vite + React 19 + Redux Toolkit + Google Inter
  CopilotPanel  →  POST /api/chat | /api/upload
  ComplaintForm →  PATCH local fields, POST /api/complaints
backend/
  FastAPI       →  LangGraph StateGraph (graph.py)
  tools.py      →  log / edit / extract / chat
  SQLAlchemy    →  SQLite by default, PostgreSQL optional
```

Named LangGraph nodes (point at these in a code walkthrough):

1. `intent_router` — log vs edit vs extract vs chat vs Q&A  
2. `log_complaint` / `edit_complaint` / `extract_document` — structured intake  
3. `risk_and_quality_enrichment` — fills gaps if the pack omitted completeness  
4. `duplicate_scan` — SQL match on product + batch against saved complaints  
5. `compose_assistant_reply` — confirmation Bunny shows in the chat pane  
6. `chat` / `qa` — small talk, refusals, and questions about the current record  

### Models

The assignment listed Groq `gemma2-9b-it` and `llama-3.3-70b-versatile`. Both are retired (`gemma2-9b-it` on 8 Oct 2025, `llama-3.3-70b-versatile` on 16 Aug 2026). The live default is **`openai/gpt-oss-20b`**. `config.py` still remaps the old IDs if they appear in `.env`.

Optional Llama API (`https://api.llama-api.com`) is a short-timeout fallback. Groq is the path used in the demo.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19, Redux Toolkit, Vite 8, Google Inter |
| API | FastAPI, Pydantic v2, Uvicorn |
| Agent | LangGraph `StateGraph`, LangChain tools |
| LLM | Groq `openai/gpt-oss-20b` (JSON intake + prose) |
| Documents | `pypdf`, `python-docx`, stdlib `email` |
| Database | SQLite (default) or PostgreSQL 16 via Docker Compose |
| Persistence | SQLAlchemy 2.x (`create_all` at startup) |

---

## Quick start

### 1. Groq key

Create a key at [console.groq.com/keys](https://console.groq.com/keys). You do not need to pick `gemma2-9b-it` — it is not listed.

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Set `GROQ_API_KEY` in `backend/.env`. Leave `LLM_PROVIDER=groq`.

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to port 8000.

macOS / Linux: `source .venv/bin/activate` and `cp .env.example .env`.

### PostgreSQL (optional)

SQLite is the default (`backend/qms.db`) so the demo runs without Docker.

```powershell
docker compose up -d postgres
```

Then in `backend/.env`:

```
DATABASE_URL=postgresql+psycopg2://qms:qms@localhost:5432/qms
```

---

## Demo script

Sample files live in [`samples/`](samples/). Paste the prompts into Bunny.

### 1. Log complaint

> Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg. Batch BMX24601, manufactured 04 Mar 2026, expiry 03 Mar 2028. 48 capsules isolated at the Koramangala store. Please log the complaint.

The left form fills. Risk typically classifies discoloration as **Major**, with a next action such as route to QA investigation.

You can also upload [`samples/apollo_amoxicillin_complaint.pdf`](samples/apollo_amoxicillin_complaint.pdf).

### 2. Edit complaint

> Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules.

Only those fields should change. Risk refreshes.

### 3. Document extraction

Upload [`samples/metformin_hcl_api_complaint.pdf`](samples/metformin_hcl_api_complaint.pdf).

Expect Metformin Hydrochloride API, IP/BP, batch `MFH260712A`, 50 kg / 2 HDPE drums.

Then:

> Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDPE drums.

Also works with [`samples/helixform_metformin_complaint.eml`](samples/helixform_metformin_complaint.eml) or pasted [`samples/apollo_amoxicillin_complaint.txt`](samples/apollo_amoxicillin_complaint.txt).

Regenerate PDFs:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python ..\samples\generate_samples.py
```

---

## HTTP API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Provider, model IDs, whether keys are present |
| `POST` | `/api/chat` | Prompt + current complaint → graph |
| `POST` | `/api/upload` | PDF / DOCX / TXT / EML → `extract_document` |
| `GET` | `/api/complaints` | Saved records (duplicate scan + recents) |
| `POST` | `/api/complaints` | Human save of the draft |
| `POST` | `/api/complaints/reset` | Empty draft |

Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Repository layout

```
backend/app/main.py                 FastAPI routes
backend/app/agent/graph.py          LangGraph StateGraph
backend/app/agent/tools.py          log / edit / extract / chat
backend/app/agent/schemas.py        Complaint, risk, insights contracts
backend/app/agent/llm.py            Groq + optional Llama clients
backend/app/models.py               SQLAlchemy complaint + audit_events
frontend/src/components/             Form, Bunny, risk card
frontend/src/store/                  Redux slices and thunks
samples/                             Demo PDF, email, and text
docker-compose.yml                   PostgreSQL 16
```

---

## Regulatory note

The module is designed around **21 CFR 211.198**, **ICH Q7**, and **EU GMP Chapter 8** complaint handling. Human verification is required before a complaint is a committed GxP record. This repository is a prototype, not a 21 CFR Part 11 validated system.
