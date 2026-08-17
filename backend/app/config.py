"""Application settings loaded from environment / .env."""

from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env", override=True)

RETIRED_MODELS = {
    "gemma2-9b-it": "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
    "llama-3.1-8b-instant": "openai/gpt-oss-20b",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    groq_api_key: str = ""
    groq_agent_model: str = "openai/gpt-oss-120b"
    groq_extract_model: str = "openai/gpt-oss-20b"
    llm_provider: str = "groq"
    llama_api_key: str = ""
    llama_api_base: str = "https://api.llama-api.com"
    llama_agent_model: str = "llama3.3-70b"
    llama_extract_model: str = "llama3.1-8b"
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'qms.db').as_posix()}"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_upload_mb: int = 10

    def resolve_model(self, model_id: str) -> str:
        return RETIRED_MODELS.get(model_id, model_id)

    @property
    def agent_model(self) -> str:
        if self.llm_provider == "llama" and self.llama_api_key and not self.groq_api_key:
            return self.llama_agent_model
        return self.resolve_model(self.groq_extract_model)

    @property
    def extract_model(self) -> str:
        if self.llm_provider == "llama" and self.llama_api_key and not self.groq_api_key:
            return self.llama_extract_model
        return self.resolve_model(self.groq_extract_model)

    @property
    def origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
