"""LLM clients — Groq first (fast), Llama only as a short-timeout fallback."""

from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from app.config import settings


def _has_llama() -> bool:
    return bool(settings.llama_api_key)


def _has_groq() -> bool:
    key = settings.groq_api_key
    return bool(key) and not key.startswith("your_")


def _require_any_key() -> None:
    if not _has_llama() and not _has_groq():
        raise RuntimeError(
            "No LLM key configured. Set LLAMA_API_KEY or GROQ_API_KEY in backend/.env"
        )


def groq_fast():
    """Single fast model for intake. gpt-oss-20b is ~1000 tok/s on Groq."""
    _require_any_key()
    return ChatGroq(
        model=settings.resolve_model(settings.groq_extract_model),
        api_key=settings.groq_api_key,
        temperature=0,
        max_tokens=1200,
        timeout=20,
        model_kwargs={"response_format": {"type": "json_object"}},
    )


def groq_prose():
    return ChatGroq(
        model=settings.resolve_model(settings.groq_extract_model),
        api_key=settings.groq_api_key,
        temperature=0.2,
        max_tokens=256,
        timeout=12,
    )


def llama_llm(*, model: str, temperature: float, max_tokens: int, json_mode: bool = False):
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    return ChatOpenAI(
        model=model,
        api_key=settings.llama_api_key,
        base_url=settings.llama_api_base.rstrip("/"),
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=8,
        model_kwargs=kwargs,
    )


def extract_llm():
    return groq_fast() if _has_groq() else llama_llm(
        model=settings.llama_extract_model, temperature=0, max_tokens=1200, json_mode=True
    )


def agent_llm():
    return extract_llm()


def prose_llm():
    if _has_groq():
        return groq_prose()
    return llama_llm(model=settings.llama_agent_model, temperature=0.2, max_tokens=256)


def fallback_llms(*, reasoning: bool, prose: bool = False) -> list:
    """Groq first. Llama is a brief fallback only — never block on it."""
    _require_any_key()
    chain = []
    if _has_groq():
        chain.append(groq_prose() if prose else groq_fast())
    if _has_llama():
        chain.append(
            llama_llm(
                model=settings.llama_agent_model if reasoning or prose else settings.llama_extract_model,
                temperature=0.1,
                max_tokens=256 if prose else 1200,
                json_mode=not prose,
            )
        )
    return chain
