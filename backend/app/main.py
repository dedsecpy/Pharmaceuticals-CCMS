"""FastAPI entrypoint — REST surface for the AIVOA complaint copilot."""

from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agent.graph import complaint_graph
from app.agent.schemas import empty_complaint, empty_insights, empty_risk
from app.config import settings
from app.crud import complaint_to_dict, list_complaints, log_event, save_complaint
from app.database import get_db, init_db
from app.services.documents import parse_document

MAX_BYTES = settings.max_upload_mb * 1024 * 1024


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    complaint: dict[str, Any] = Field(default_factory=empty_complaint)
    risk_assessment: dict[str, Any] = Field(default_factory=empty_risk)
    quality_insights: dict[str, Any] = Field(default_factory=empty_insights)
    history: list[dict[str, str]] = Field(default_factory=list)


class SaveRequest(BaseModel):
    complaint: dict[str, Any]
    risk_assessment: dict[str, Any] = Field(default_factory=dict)
    quality_insights: dict[str, Any] = Field(default_factory=dict)
    source_filename: str | None = None


app = FastAPI(
    title="AIVOA QMS — Customer Complaint Copilot",
    version="1.0.0",
    description="AI-powered complaint intake for API & FDF manufacturing QA.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "provider": settings.llm_provider,
        "agent_model": settings.agent_model,
        "extract_model": settings.extract_model,
        "has_llama_key": bool(settings.llama_api_key),
        "has_groq_key": bool(settings.groq_api_key) and not settings.groq_api_key.startswith("your_"),
    }


def _run_graph(
    *,
    user_text: str,
    complaint: dict[str, Any],
    risk: dict[str, Any],
    insights: dict[str, Any],
    document_text: str | None,
    filename: str | None,
    db: Session,
) -> dict[str, Any]:
    saved = [complaint_to_dict(row) for row in list_complaints(db, limit=50)]
    try:
        result = complaint_graph.invoke(
            {
                "user_text": user_text,
                "document_text": document_text,
                "source_filename": filename,
                "complaint": complaint or empty_complaint(),
                "risk_assessment": risk or empty_risk(),
                "quality_insights": insights or empty_insights(),
                "duplicates": [],
                "saved_complaints": saved,
                "trace": [],
                "tools_used": [],
                "assistant_reply": "",
                "messages": [],
            }
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI pipeline failed: {exc}") from exc

    payload = {
        "assistant_reply": result.get("assistant_reply") or "The record has been updated.",
        "intent": result.get("intent"),
        "tools_used": result.get("tools_used") or [],
        "trace": result.get("trace") or [],
        "complaint": result.get("complaint") or complaint,
        "risk_assessment": result.get("risk_assessment") or risk,
        "quality_insights": result.get("quality_insights") or insights,
        "duplicates": result.get("duplicates") or [],
        "models": {
            "agent": settings.agent_model,
            "extract": settings.extract_model,
        },
    }
    log_event(
        db,
        action=payload["intent"] or "GRAPH",
        payload={"tools_used": payload["tools_used"], "trace": payload["trace"]},
    )
    return payload


@app.post("/api/chat")
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    return _run_graph(
        user_text=body.message,
        complaint=body.complaint,
        risk=body.risk_assessment,
        insights=body.quality_insights,
        document_text=None,
        filename=None,
        db=db,
    )


@app.post("/api/upload")
async def upload(
    file: UploadFile = File(...),
    note: str = Form(""),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb}MB limit.")
    try:
        text = parse_document(file.filename, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not text.strip():
        raise HTTPException(status_code=400, detail="The document contained no readable text.")

    extra = note.strip()
    if extra:
        text = f"{text}\n\nAdditional context from the user:\n{extra}"
        user_text = (
            f"Extract the customer complaint from uploaded file {file.filename}. "
            f"The user also said: {extra}"
        )
    else:
        user_text = f"Extract the customer complaint from uploaded file {file.filename}."

    return _run_graph(
        user_text=user_text,
        complaint=empty_complaint(),
        risk=empty_risk(),
        insights=empty_insights(),
        document_text=text,
        filename=file.filename,
        db=db,
    )


@app.get("/api/complaints")
def get_complaints(db: Session = Depends(get_db)):
    return [complaint_to_dict(row) for row in list_complaints(db)]


@app.post("/api/complaints")
def post_complaint(body: SaveRequest, db: Session = Depends(get_db)):
    row = save_complaint(
        db,
        body.complaint,
        risk=body.risk_assessment,
        insights=body.quality_insights,
        source_filename=body.source_filename,
    )
    return complaint_to_dict(row)


@app.post("/api/complaints/reset")
def reset():
    return {
        "complaint": empty_complaint(),
        "risk_assessment": empty_risk(),
        "quality_insights": empty_insights(),
        "duplicates": [],
    }
