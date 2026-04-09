from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App identity — used in Open Library User-Agent and API docs
    app_name: str = "Books-Tracks"
    app_version: str = "0.1.0"
    contact_email: str = "bryangraterol.25@gmail.com"

    admin_email: str = "bryangraterol.25@gmail.com"
    demo_email: str = "demo@books-tracks.demo"
    demo_name: str = "Usuario Demo"

    database_url: str
    cors_origins: list[str] = [
        "http://localhost:5173",   # Vite dev
        "http://localhost:3000",   # fallback
    ]
    google_books_api_key: str = ""

    @property
    def user_agent(self) -> str:
        return f"{self.app_name}/{self.app_version} ({self.contact_email})"


settings = Settings()  # type: ignore[call-arg]
