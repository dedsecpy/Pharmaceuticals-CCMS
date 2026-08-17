"""Pydantic contracts shared by the LangGraph agent and FastAPI."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ComplaintForm(BaseModel):
    complaint_source: str | None = None
    customer_name: str | None = None
    product_name: str | None = None
    product_strength_grade: str | None = None
    batch_lot_number: str | None = None
    manufacturing_date: str | None = None
    expiry_date: str | None = None
    quantity_affected: str | None = None
    quantity_unit: str | None = None
    complaint_type: str | None = None
    complaint_date: str | None = None
    detailed_description: str | None = None
    initial_severity: str | None = None
    priority: str | None = None
    status: str = "Pending Triage"

    model_config = {"extra": "ignore"}


class RiskAssessment(BaseModel):
    severity: str | None = Field(None, description="Critical | Major | Minor")
    priority: str | None = Field(None, description="Urgent | High | Medium | Low")
    patient_safety_impact: str | None = None
    regulatory_reporting: str | None = None
    batch_disposition: str | None = None
    next_action: str | None = None
    investigation_type: str | None = None
    rationale: str | None = None
    confidence: str | None = None

    model_config = {"extra": "ignore"}


class QualityInsights(BaseModel):
    summary: str | None = None
    completeness_score: int = 0
    missing_fields: list[str] = Field(default_factory=list)
    root_cause_hypothesis: str | None = None
    capa_recommendation: str | None = None
    is_complete: bool = False

    model_config = {"extra": "ignore"}


class DuplicateHit(BaseModel):
    complaint_number: str
    product_name: str | None = None
    batch_lot_number: str | None = None
    similarity_reason: str


class AgentResponse(BaseModel):
    assistant_reply: str
    intent: str
    tools_used: list[str] = Field(default_factory=list)
    trace: list[str] = Field(default_factory=list)
    complaint: dict[str, Any]
    risk_assessment: dict[str, Any]
    quality_insights: dict[str, Any]
    duplicates: list[dict[str, Any]] = Field(default_factory=list)


REQUIRED_FIELDS = [
    "customer_name",
    "product_name",
    "product_strength_grade",
    "batch_lot_number",
    "quantity_affected",
    "complaint_type",
    "detailed_description",
    "complaint_source",
]


def empty_complaint() -> dict[str, Any]:
    data = ComplaintForm().model_dump()
    return data


def empty_risk() -> dict[str, Any]:
    return RiskAssessment().model_dump()


def empty_insights() -> dict[str, Any]:
    return QualityInsights().model_dump()


Intent = Literal["log_complaint", "edit_complaint", "extract_document", "qa"]
