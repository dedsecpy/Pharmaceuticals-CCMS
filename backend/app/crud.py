"""Complaint persistence and audit helpers."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AuditEvent, Complaint


def next_complaint_number(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"CMP-{year}-"
    count = db.scalar(select(func.count()).select_from(Complaint).where(Complaint.complaint_number.like(f"{prefix}%")))
    return f"{prefix}{int(count or 0) + 1:04d}"


def list_complaints(db: Session, limit: int = 25) -> list[Complaint]:
    return list(db.scalars(select(Complaint).order_by(Complaint.created_at.desc()).limit(limit)))


def complaint_to_dict(row: Complaint) -> dict:
    return {
        "id": row.id,
        "complaint_number": row.complaint_number,
        "complaint_source": row.complaint_source,
        "customer_name": row.customer_name,
        "product_name": row.product_name,
        "product_strength_grade": row.product_strength_grade,
        "batch_lot_number": row.batch_lot_number,
        "manufacturing_date": row.manufacturing_date,
        "expiry_date": row.expiry_date,
        "quantity_affected": row.quantity_affected,
        "quantity_unit": row.quantity_unit,
        "complaint_type": row.complaint_type,
        "complaint_date": row.complaint_date,
        "detailed_description": row.detailed_description,
        "initial_severity": row.initial_severity,
        "priority": row.priority,
        "status": row.status,
        "risk_assessment": row.risk_assessment,
        "quality_insights": row.quality_insights,
        "source_filename": row.source_filename,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def save_complaint(
    db: Session,
    payload: dict,
    *,
    risk: dict | None,
    insights: dict | None,
    source_text: str | None = None,
    source_filename: str | None = None,
) -> Complaint:
    number = next_complaint_number(db)
    row = Complaint(
        complaint_number=number,
        complaint_source=payload.get("complaint_source"),
        customer_name=payload.get("customer_name"),
        product_name=payload.get("product_name"),
        product_strength_grade=payload.get("product_strength_grade"),
        batch_lot_number=payload.get("batch_lot_number"),
        manufacturing_date=payload.get("manufacturing_date"),
        expiry_date=payload.get("expiry_date"),
        quantity_affected=payload.get("quantity_affected"),
        quantity_unit=payload.get("quantity_unit"),
        complaint_type=payload.get("complaint_type"),
        complaint_date=payload.get("complaint_date"),
        detailed_description=payload.get("detailed_description"),
        initial_severity=payload.get("initial_severity"),
        priority=payload.get("priority"),
        status="Logged",
        risk_assessment=risk,
        quality_insights=insights,
        source_text=source_text,
        source_filename=source_filename,
    )
    db.add(row)
    db.flush()
    db.add(
        AuditEvent(
            complaint_id=row.id,
            action="SAVE_COMPLAINT",
            payload={"complaint_number": number},
        )
    )
    db.commit()
    db.refresh(row)
    return row


def log_event(db: Session, action: str, payload: dict | None = None) -> None:
    db.add(AuditEvent(action=action, payload=payload))
    db.commit()
