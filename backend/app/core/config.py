from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./data_dictionary.db"
    
    # Security
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    ACCESS_TOKEN_EXPIRE_MINUTES_REMEMBER: int = 43200  # 30 days
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # AI
    ANTHROPIC_API_KEY: str = ""
    
    # Application
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "Data Dictionary Agent"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


# Global settings instance
settings = Settings()
