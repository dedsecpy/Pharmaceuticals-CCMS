"""Parse uploaded complaint documents into plain text. OCR is intentionally not used."""

from __future__ import annotations

import email
from email import policy
from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader


SUPPORTED = {".pdf", ".docx", ".txt", ".eml"}


def parse_document(filename: str, data: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED:
        raise ValueError(f"Unsupported file type '{suffix}'. Use PDF, DOCX, TXT, or EML.")
    if suffix == ".pdf":
        return _pdf(data)
    if suffix == ".docx":
        return _docx(data)
    if suffix == ".eml":
        return _eml(data)
    return data.decode("utf-8", errors="replace")


def _pdf(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    pages = [(page.extract_text() or "") for page in reader.pages]
    text = "\n".join(pages).strip()
    if not text:
        raise ValueError(
            "This PDF has no extractable text. Use a text-based PDF (production OCR is out of scope)."
        )
    return text


def _docx(data: bytes) -> str:
    document = Document(BytesIO(data))
    return "\n".join(p.text for p in document.paragraphs if p.text).strip()


def _eml(data: bytes) -> str:
    message = email.message_from_bytes(data, policy=policy.default)
    parts = [
        f"From: {message.get('from', '')}",
        f"To: {message.get('to', '')}",
        f"Subject: {message.get('subject', '')}",
        f"Date: {message.get('date', '')}",
        "",
    ]
    body = message.get_body(preferencelist=("plain", "html"))
    if body is not None:
        parts.append(str(body.get_content()))
    else:
        parts.append(message.get_content())
    return "\n".join(parts).strip()
