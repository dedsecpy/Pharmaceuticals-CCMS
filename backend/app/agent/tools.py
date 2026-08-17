"""LangChain tools used by the complaint intake graph.

One Groq JSON call does extraction + risk + reply. The graph still
exposes log_complaint / edit_complaint / extract_document as named tools.
"""

from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

from app.agent.json_utils import message_text, parse_json_object
from app.agent.llm import fallback_llms
from app.agent.prompts import SYSTEM_BUNNY, SYSTEM_EDIT, SYSTEM_INTAKE
from app.agent.schemas import (
    REQUIRED_FIELDS,
    ComplaintForm,
    QualityInsights,
    RiskAssessment,
    empty_complaint,
    empty_insights,
    empty_risk,
)


def _invoke_json(system: str, user: str) -> dict[str, Any]:
    last_error: Exception | None = None
    for llm in fallback_llms(reasoning=False):
        try:
            message = llm.invoke([SystemMessage(content=system), HumanMessage(content=user)])
            return parse_json_object(message_text(message))
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise last_error or RuntimeError("JSON extraction failed")


def _clean_complaint(payload: dict[str, Any], baseline: dict[str, Any] | None = None) -> dict[str, Any]:
    base = dict(baseline or empty_complaint())
    incoming = ComplaintForm.model_validate({**base, **payload}).model_dump()
    for key, value in incoming.items():
        if isinstance(value, str):
            stripped = value.strip()
            incoming[key] = stripped if stripped and stripped.lower() not in {"null", "none", "n/a", "unknown"} else None
    if not incoming.get("status"):
        incoming["status"] = "Pending Triage"
    return incoming


def compute_completeness(complaint: dict[str, Any]) -> QualityInsights:
    missing = [field for field in REQUIRED_FIELDS if not complaint.get(field)]
    filled = len(REQUIRED_FIELDS) - len(missing)
    score = int(round((filled / len(REQUIRED_FIELDS)) * 100))
    return QualityInsights(
        completeness_score=score,
        missing_fields=missing,
        is_complete=len(missing) == 0,
    )


def _pack_from_payload(data: dict[str, Any], baseline: dict[str, Any] | None = None) -> dict[str, Any]:
    complaint_raw = data.get("complaint") if isinstance(data.get("complaint"), dict) else data
    complaint = _clean_complaint(complaint_raw, baseline=baseline)
    risk_raw = data.get("risk") if isinstance(data.get("risk"), dict) else data
    risk = RiskAssessment.model_validate(risk_raw).model_dump()
    if risk.get("severity"):
        complaint["initial_severity"] = risk["severity"]
    if risk.get("priority"):
        complaint["priority"] = risk["priority"]
    completeness = compute_completeness(complaint)
    insights = QualityInsights(
        summary=data.get("summary"),
        completeness_score=completeness.completeness_score,
        missing_fields=completeness.missing_fields,
        is_complete=completeness.is_complete,
        root_cause_hypothesis=data.get("root_cause_hypothesis"),
        capa_recommendation=data.get("capa_recommendation"),
    ).model_dump()
    reply = (data.get("assistant_reply") or "").strip() or _template_reply(complaint, risk, insights)
    return {
        "complaint": complaint,
        "risk_assessment": risk,
        "quality_insights": insights,
        "assistant_reply": reply,
    }


def _template_reply(complaint: dict[str, Any], risk: dict[str, Any], insights: dict[str, Any]) -> str:
    product = complaint.get("product_name") or "the reported product"
    severity = risk.get("severity") or complaint.get("initial_severity") or "unclassified"
    action = risk.get("next_action") or "QA review"
    missing = insights.get("missing_fields") or []
    line = f"Logged {product} as {severity}. Next action: {action}."
    if missing:
        labels = ", ".join(missing[:4])
        line += f" Still needed: {labels}."
    return line


def log_complaint_fn(text: str) -> dict[str, Any]:
    """Extract a new complaint, risk assessment, and reply in one call."""
    data = _invoke_json(SYSTEM_INTAKE, f"COMPLAINT TEXT:\n{text}")
    return _pack_from_payload(data)


def edit_complaint_fn(text: str, current: dict[str, Any]) -> dict[str, Any]:
    """Patch an existing complaint from a natural-language correction."""
    user = (
        f"CURRENT_RECORD:\n{json.dumps(current, indent=2)}\n\n"
        f"USER CORRECTION:\n{text}"
    )
    data = _invoke_json(SYSTEM_EDIT, user)
    return _pack_from_payload(data, baseline=current)


def extract_document_fn(document_text: str, filename: str | None = None) -> dict[str, Any]:
    """Extract a complaint record from parsed document text."""
    header = f"SOURCE FILE: {filename}\n\n" if filename else ""
    data = _invoke_json(SYSTEM_INTAKE, f"{header}DOCUMENT CONTENT:\n{document_text[:12000]}")
    return _pack_from_payload(data)


def enrich_risk_fn(complaint: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Deterministic completeness only — risk is produced in the intake call."""
    completeness = compute_completeness(complaint)
    return empty_risk(), completeness.model_dump()


_GREETINGS = {
    "hi",
    "hii",
    "hiii",
    "hello",
    "hey",
    "yo",
    "sup",
    "howdy",
    "namaste",
    "thanks",
    "thank you",
    "thx",
    "ty",
    "ok",
    "okay",
    "cool",
    "nice",
    "great",
    "bye",
    "goodbye",
    "gm",
    "gn",
}

_GREETING_PREFIXES = (
    "hi ",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
    "how's it going",
    "hows it going",
    "what's up",
    "whats up",
    "thank you",
    "thanks",
    "hi bunny",
    "hey bunny",
    "hello bunny",
)

_COMPLAINT_CUES = (
    "complaint",
    "complain",
    "reported",
    "batch",
    "lot number",
    "lot no",
    "capsules",
    "tablets",
    "discolor",
    "discolour",
    "contaminat",
    "label",
    "pharmacy",
    "defect",
    "quality",
    "expiry",
    "exp date",
    "manufactur",
    "amoxicillin",
    "metformin",
    "paracetamol",
    "atorvastatin",
    "customer",
    "drums",
    "blister",
    "potency",
    "assay",
    "foreign",
    "wrong strength",
    "1000mg",
    "500 mg",
    "500mg",
    "log this",
    "log the",
    "please log",
    "api ",
    " fdf",
    "quarantine",
    "recall",
)

_CODE_CUES = (
    "write code",
    "write a function",
    "python",
    "javascript",
    "typescript",
    "html",
    "css",
    "react component",
    "sql query",
    "leetcode",
    "debug this",
    "implement",
    "source code",
    "github",
    "script for",
    "compile",
)


def _looks_like_greeting(text: str) -> bool:
    lowered = text.strip().lower().strip("!.,?")
    if lowered in _GREETINGS or lowered in {"hi bunny", "hey bunny", "hello bunny"}:
        return True
    return any(lowered.startswith(prefix) for prefix in _GREETING_PREFIXES) and len(lowered) < 80


def _looks_like_complaint(text: str) -> bool:
    lowered = text.lower()
    return any(cue in lowered for cue in _COMPLAINT_CUES)


def _looks_like_code(text: str) -> bool:
    lowered = text.lower()
    return any(cue in lowered for cue in _CODE_CUES)


def route_intent_fn(
    text: str,
    *,
    has_document: bool,
    has_existing: bool,
) -> str:
    if has_document:
        return "extract_document"
    raw = text.strip()
    if not raw:
        return "chat"
    if _looks_like_code(raw):
        return "chat"
    if _looks_like_greeting(raw) and not _looks_like_complaint(raw):
        return "chat"
    if _looks_like_complaint(raw) and not has_existing:
        return "log_complaint"
    if has_existing and _looks_like_correction(raw):
        return "edit_complaint"
    if has_existing and _looks_like_complaint(raw):
        return "edit_complaint"
    if has_existing and _looks_like_question(raw):
        return "qa"
    if _looks_like_complaint(raw):
        return "log_complaint"
    return "chat"


def bunny_chat_fn(
    text: str,
    *,
    complaint: dict[str, Any] | None = None,
    risk: dict[str, Any] | None = None,
) -> str:
    llm = fallback_llms(reasoning=True, prose=True)[0]
    context = {
        "user_message": text,
        "current_complaint_on_form": complaint or {},
        "current_risk": risk or {},
    }
    message = llm.invoke(
        [
            SystemMessage(content=SYSTEM_BUNNY),
            HumanMessage(content=json.dumps(context, indent=2)),
        ]
    )
    return message_text(message).strip() or "Hey — Bunny here. Tell me what happened and I’ll take the complaint."


def _looks_like_correction(text: str) -> bool:
    lowered = text.lower()
    cues = (
        "sorry",
        "actually",
        "update",
        "change",
        "correct",
        "instead",
        "batch",
        "quantity",
        "qty",
        "lot",
        "affected",
        "should be",
        "make it",
    )
    return any(cue in lowered for cue in cues)


def _looks_like_question(text: str) -> bool:
    lowered = text.strip().lower()
    return lowered.endswith("?") or lowered.startswith(
        ("what", "why", "how", "who", "when", "explain", "summarize")
    )


def compose_reply_fn(
    *,
    intent: str,
    complaint: dict[str, Any],
    risk: dict[str, Any],
    insights: dict[str, Any],
    duplicates: list[dict[str, Any]],
    user_text: str,
    existing_reply: str | None = None,
) -> str:
    if existing_reply and existing_reply.strip():
        if duplicates:
            extra = " Possible duplicate: " + "; ".join(
                f"{d.get('complaint_number')} ({d.get('similarity_reason')})" for d in duplicates[:2]
            )
            return existing_reply.rstrip(".") + "." + extra
        return existing_reply
    if intent in {"chat", "qa"}:
        try:
            return bunny_chat_fn(user_text, complaint=complaint, risk=risk)
        except Exception:
            if _looks_like_code(user_text):
                return "I can’t help with code — I’m Bunny, your QA complaint assistant. If a product or batch went wrong, tell me and I’ll log it."
            return "Hey, I’m Bunny. I can take a customer complaint whenever you’re ready — product, batch, and what went wrong is plenty."
    return _template_reply(complaint, risk, insights)


@tool("log_complaint")
def log_complaint_tool(complaint_text: str) -> str:
    """Log a new customer complaint from a natural language prompt."""
    return json.dumps(log_complaint_fn(complaint_text)["complaint"])


@tool("edit_complaint")
def edit_complaint_tool(correction: str, current_record_json: str) -> str:
    """Edit the current complaint using a natural language correction."""
    current = json.loads(current_record_json)
    return json.dumps(edit_complaint_fn(correction, current)["complaint"])


@tool("extract_document")
def extract_document_tool(document_text: str, filename: str = "") -> str:
    """Extract complaint details from uploaded PDF, DOCX, TXT, or EML content."""
    return json.dumps(extract_document_fn(document_text, filename or None)["complaint"])


INTAKE_TOOLS = [log_complaint_tool, edit_complaint_tool, extract_document_tool]
