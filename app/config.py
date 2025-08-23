import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    base_dir: Path = Path(__file__).resolve().parent
    templates_dir: Path = Path(__file__).resolve().parent / "templates"
    
    # MongoDB Atlas configuration
    mongodb_uri: str = Field(default="mongodb://localhost:27017", env='MONGODB_URI')
    mongodb_database: str = Field(default="video_membership", env='MONGODB_DATABASE')

    
    secret_key: str = Field(...)
    jwt_algorithm: str = Field(default='HS256')
    session_duration: int = Field(default=86400)
    algolia_app_id: str
    algolia_api_key: str
    algolia_index_name: str

    model_config = {
        "env_file": ".env",
        "extra": "ignore"  # Ignore extra fields during migration
    }


@lru_cache
def get_settings():
    return Settings()