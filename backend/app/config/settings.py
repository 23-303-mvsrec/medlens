from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "medlens_db"
    SECRET_KEY: str = "your_secret_key_here"  # Should be changed in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours (1 day)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://medlens-clinical.vercel.app"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

