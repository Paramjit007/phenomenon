from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://phenomenon:phenomenon@db/phenomenon"
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()
