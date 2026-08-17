"""Pull a JSON object out of an LLM response that may include fences or reasoning."""

from __future__ import annotations

import json
import re
from typing import Any


_FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


def parse_json_object(text: str) -> dict[str, Any]:
    if not text:
        raise ValueError("Empty model response")

    raw = text.strip()
    fenced = _FENCE.findall(raw)
    if fenced:
        raw = fenced[-1].strip()

    try:
        value = json.loads(raw)
        if isinstance(value, dict):
            return value
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No JSON object found in model response: {text[:400]}")

    value = json.loads(raw[start : end + 1])
    if not isinstance(value, dict):
        raise ValueError("JSON payload was not an object")
    return value


def message_text(message: Any) -> str:
    extra = getattr(message, "additional_kwargs", None) or {}
    content = getattr(message, "content", message)
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("text"):
                parts.append(str(block["text"]))
        text = "\n".join(parts)
    else:
        text = str(content or "")
    reasoning = extra.get("reasoning_content") or extra.get("reasoning") or ""
    if "{" in text:
        return text
    if isinstance(reasoning, str) and reasoning:
        return f"{text}\n{reasoning}"
    return text
