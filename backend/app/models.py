"""ORM models for complaints and a lightweight audit trail."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    complaint_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_strength_grade: Mapped[str | None] = mapped_column(String(255), nullable=True)
    batch_lot_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    manufacturing_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quantity_affected: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quantity_unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    complaint_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    complaint_date: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detailed_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    initial_severity: Mapped[str | None] = mapped_column(String(32), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="Pending Triage")

    risk_assessment: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    quality_insights: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    events: Mapped[list["AuditEvent"]] = relationship(back_populates="complaint")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("complaints.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(64))
    actor: Mapped[str] = mapped_column(String(64), default="AIVOA Copilot")
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    complaint: Mapped[Complaint | None] = relationship(back_populates="events")
