"""LangGraph StateGraph for complaint intake.

Interview walkthrough:
  Copilot prompt/upload
    -> FastAPI /api/chat or /api/upload
    -> graph.invoke
    -> intent_router
    -> log_complaint | edit_complaint | extract_document
    -> risk_and_quality_enrichment
    -> duplicate_scan
    -> compose_assistant_reply
    -> Redux updates the left form + risk card
"""

from __future__ import annotations

from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from app.agent.schemas import empty_complaint, empty_insights, empty_risk
from app.agent.tools import (
    bunny_chat_fn,
    compose_reply_fn,
    edit_complaint_fn,
    enrich_risk_fn,
    extract_document_fn,
    log_complaint_fn,
    route_intent_fn,
)


class AgentState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    user_text: str
    document_text: str | None
    source_filename: str | None
    intent: str
    complaint: dict[str, Any]
    risk_assessment: dict[str, Any]
    quality_insights: dict[str, Any]
    duplicates: list[dict[str, Any]]
    saved_complaints: list[dict[str, Any]]
    trace: list[str]
    tools_used: list[str]
    assistant_reply: str


def _trace(state: AgentState, node: str) -> list[str]:
    return [*state.get("trace", []), node]


def intent_router(state: AgentState) -> dict[str, Any]:
    intent = route_intent_fn(
        state.get("user_text") or "",
        has_document=bool(state.get("document_text")),
        has_existing=_occupied(state.get("complaint") or {}),
    )
    if state.get("document_text"):
        intent = "extract_document"
    return {"intent": intent, "trace": _trace(state, "intent_router")}


def _occupied(complaint: dict[str, Any]) -> bool:
    return bool(
        complaint.get("product_name")
        or complaint.get("detailed_description")
        or complaint.get("customer_name")
        or complaint.get("batch_lot_number")
    )


def log_complaint_node(state: AgentState) -> dict[str, Any]:
    pack = log_complaint_fn(state.get("user_text") or "")
    return {
        "complaint": pack["complaint"],
        "risk_assessment": pack["risk_assessment"],
        "quality_insights": pack["quality_insights"],
        "assistant_reply": pack["assistant_reply"],
        "tools_used": [*state.get("tools_used", []), "log_complaint"],
        "trace": _trace(state, "log_complaint"),
    }


def edit_complaint_node(state: AgentState) -> dict[str, Any]:
    pack = edit_complaint_fn(state.get("user_text") or "", state.get("complaint") or empty_complaint())
    return {
        "complaint": pack["complaint"],
        "risk_assessment": pack["risk_assessment"],
        "quality_insights": pack["quality_insights"],
        "assistant_reply": pack["assistant_reply"],
        "tools_used": [*state.get("tools_used", []), "edit_complaint"],
        "trace": _trace(state, "edit_complaint"),
    }


def extract_document_node(state: AgentState) -> dict[str, Any]:
    pack = extract_document_fn(
        state.get("document_text") or state.get("user_text") or "",
        state.get("source_filename"),
    )
    return {
        "complaint": pack["complaint"],
        "risk_assessment": pack["risk_assessment"],
        "quality_insights": pack["quality_insights"],
        "assistant_reply": pack["assistant_reply"],
        "tools_used": [*state.get("tools_used", []), "extract_document"],
        "trace": _trace(state, "extract_document"),
    }


def chat_node(state: AgentState) -> dict[str, Any]:
    reply = bunny_chat_fn(
        state.get("user_text") or "",
        complaint=state.get("complaint"),
        risk=state.get("risk_assessment"),
    )
    return {
        "assistant_reply": reply,
        "tools_used": state.get("tools_used") or [],
        "trace": _trace(state, "chat"),
    }


def qa_node(state: AgentState) -> dict[str, Any]:
    reply = bunny_chat_fn(
        state.get("user_text") or "",
        complaint=state.get("complaint"),
        risk=state.get("risk_assessment"),
    )
    return {
        "assistant_reply": reply,
        "trace": _trace(state, "qa"),
    }


def risk_and_quality_enrichment(state: AgentState) -> dict[str, Any]:
    # Risk is already produced in the intake tool call. Only fill gaps.
    if state.get("risk_assessment") and any(state["risk_assessment"].values()):
        complaint = state.get("complaint") or empty_complaint()
        insights = state.get("quality_insights") or empty_insights()
        if not insights.get("completeness_score"):
            from app.agent.tools import compute_completeness

            insights = {**insights, **compute_completeness(complaint).model_dump()}
        return {
            "quality_insights": insights,
            "trace": _trace(state, "risk_and_quality_enrichment"),
        }
    complaint = dict(state.get("complaint") or empty_complaint())
    risk, insights = enrich_risk_fn(complaint)
    return {
        "complaint": complaint,
        "risk_assessment": risk,
        "quality_insights": insights,
        "trace": _trace(state, "risk_and_quality_enrichment"),
    }


def duplicate_scan(state: AgentState) -> dict[str, Any]:
    current = state.get("complaint") or {}
    saved = state.get("saved_complaints") or []
    hits: list[dict[str, Any]] = []
    batch = (current.get("batch_lot_number") or "").strip().lower()
    product = (current.get("product_name") or "").strip().lower()
    if batch or product:
        for row in saved:
            reasons = []
            other_batch = (row.get("batch_lot_number") or "").strip().lower()
            other_product = (row.get("product_name") or "").strip().lower()
            if batch and other_batch and batch == other_batch:
                reasons.append("same batch/lot number")
            if product and other_product and product == other_product:
                reasons.append("same product")
            if reasons:
                hits.append(
                    {
                        "complaint_number": row.get("complaint_number"),
                        "product_name": row.get("product_name"),
                        "batch_lot_number": row.get("batch_lot_number"),
                        "similarity_reason": "; ".join(reasons),
                    }
                )
    return {"duplicates": hits[:5], "trace": _trace(state, "duplicate_scan")}


def compose_assistant_reply(state: AgentState) -> dict[str, Any]:
    reply = compose_reply_fn(
        intent=state.get("intent") or "qa",
        complaint=state.get("complaint") or empty_complaint(),
        risk=state.get("risk_assessment") or empty_risk(),
        insights=state.get("quality_insights") or empty_insights(),
        duplicates=state.get("duplicates") or [],
        user_text=state.get("user_text") or "",
        existing_reply=state.get("assistant_reply"),
    )
    return {"assistant_reply": reply, "trace": _trace(state, "compose_assistant_reply")}


def _route_after_intent(
    state: AgentState,
) -> Literal["log_complaint", "edit_complaint", "extract_document", "qa", "chat"]:
    intent = state.get("intent") or "chat"
    if intent in {"log_complaint", "edit_complaint", "extract_document", "qa", "chat"}:
        return intent  # type: ignore[return-value]
    return "chat"


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("intent_router", intent_router)
    graph.add_node("log_complaint", log_complaint_node)
    graph.add_node("edit_complaint", edit_complaint_node)
    graph.add_node("extract_document", extract_document_node)
    graph.add_node("qa", qa_node)
    graph.add_node("chat", chat_node)
    graph.add_node("risk_and_quality_enrichment", risk_and_quality_enrichment)
    graph.add_node("duplicate_scan", duplicate_scan)
    graph.add_node("compose_assistant_reply", compose_assistant_reply)

    graph.add_edge(START, "intent_router")
    graph.add_conditional_edges(
        "intent_router",
        _route_after_intent,
        {
            "log_complaint": "log_complaint",
            "edit_complaint": "edit_complaint",
            "extract_document": "extract_document",
            "qa": "qa",
            "chat": "chat",
        },
    )
    graph.add_edge("log_complaint", "risk_and_quality_enrichment")
    graph.add_edge("edit_complaint", "risk_and_quality_enrichment")
    graph.add_edge("extract_document", "risk_and_quality_enrichment")
    graph.add_edge("qa", "compose_assistant_reply")
    graph.add_edge("chat", "compose_assistant_reply")
    graph.add_edge("risk_and_quality_enrichment", "duplicate_scan")
    graph.add_edge("duplicate_scan", "compose_assistant_reply")
    graph.add_edge("compose_assistant_reply", END)
    return graph.compile()


complaint_graph = build_graph()
