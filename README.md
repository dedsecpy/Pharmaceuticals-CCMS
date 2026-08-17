# AIVOA QMS — Customer Complaint Copilot

AI-powered Customer Complaint module for pharmaceutical **API & FDF** manufacturing. Built for the AIVOA Round 1 AI Product Engineer intern assignment.

The left pane is the official QMS record. The right pane is the only way to fill or change it. After extraction, the copilot drafts a GMP risk assessment (severity, next action, batch disposition, CAPA).

## Mandatory stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Redux Toolkit, Vite, Google Inter |
| Backend | Python, FastAPI |
| Agent | LangGraph `StateGraph` |
| LLMs | Groq `openai/gpt-oss-120b` (reasoning) and `openai/gpt-oss-20b` (extraction) |
| Database | PostgreSQL (Docker) or SQLite fallback |

### Why not `gemma2-9b-it`?

Groq retired `gemma2-9b-it` on 8 Oct 2025 and `llama-3.3-70b-versatile` on 16 Aug 2026. The live production replacements are GPT-OSS 20B / 120B. `config.py` still maps the assignment IDs if they appear in `.env`.

## Quick start (Windows)

1. Create a Groq key at [console.groq.com/keys](https://console.groq.com/keys).

2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env and paste GROQ_API_KEY=...
python -m uvicorn app.main:app --reload --port 8000
```

3. Frontend (new terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

SQLite is the default so the app runs without Docker. To use Postgres:

```powershell
docker compose up -d postgres
```

Then set `DATABASE_URL=postgresql+psycopg2://qms:qms@localhost:5432/qms` in `backend/.env`.

## Demo script (matches the assignment video)

Sample files live in [`samples/`](samples/).

### 1. Log complaint tool

In the copilot:

> Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg. Batch BMX24601, manufactured 04 Mar 2026, expiry 03 Mar 2028. 48 capsules isolated at the Koramangala store. Please log the complaint.

Watch the left form fill and the **AI copilot risk assessment** classify discoloration as **Major**, with a next action such as route to QA investigation and issue replacement.

### 2. Edit complaint tool

> Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules.

Only those fields should change; everything else is preserved. Risk assessment refreshes.

### 3. Document extraction tool

Upload [`samples/metformin_hcl_api_complaint.pdf`](samples/metformin_hcl_api_complaint.pdf).

Expect Metformin Hydrochloride API, IP/BP, batch `MFH260712A`, 50 kg / 2 HDPE drums.

Then edit in natural language:

> Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDPE drums.

You can also upload [`samples/helixform_metformin_complaint.eml`](samples/helixform_metformin_complaint.eml) or paste [`samples/apollo_amoxicillin_complaint.txt`](samples/apollo_amoxicillin_complaint.txt).

Regenerate samples:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python ..\samples\generate_samples.py
```

## Architecture walkthrough (for the code video)

```
User prompt or PDF
  -> CopilotPanel.jsx  (chat input / dropzone)
  -> Redux thunks.js   (sendMessage / uploadDocument)
  -> POST /api/chat or /api/upload   (backend/app/main.py)
  -> LangGraph complaint_graph       (backend/app/agent/graph.py)
       intent_router
         -> log_complaint | edit_complaint | extract_document   (tools.py)
         -> risk_and_quality_enrichment
         -> duplicate_scan
         -> compose_assistant_reply
  -> JSON { complaint, risk_assessment, quality_insights, tools_used }
  -> complaintSlice.js writes the form + risk card
```

Tools are real LangChain `@tool` functions in [`backend/app/agent/tools.py`](backend/app/agent/tools.py). The graph calls the same functions from named nodes so you can point at `log_complaint` → `risk_and_quality_enrichment` in the debugger.

## Bonus AI features

- Completeness checker (missing intake fields + score)
- Root-cause hypothesis
- CAPA recommendation
- Duplicate detection against saved complaints (product + batch)
- Complaint summary
- GMP risk classification (severity, reporting, batch hold)

## Video shot list

**Video 1 — working product (5–10 min)**  
Chrome and locked form → log prompt → field flash + risk card → edit batch/qty → upload Metformin PDF → second edit → completeness / CAPA / duplicate if you save then re-log.

**Video 2 — code walk (5–10 min)**  
`CopilotPanel.jsx` → `thunks.js` → `main.py` `/api/chat` → `graph.py` nodes → `tools.py` `log_complaint_fn` → Redux `complaintSlice` → `RiskAssessment.jsx`. Mention Groq model migration.

## Project layout

```
backend/app/main.py              FastAPI
backend/app/agent/graph.py       LangGraph StateGraph
backend/app/agent/tools.py       log / edit / extract + risk
frontend/src/components/          form, copilot, risk
frontend/src/store/               Redux
samples/                          demo PDF / email / text
```

Human verification is required before a complaint is a committed GxP record. This is a prototype, not a validated eQMS.
