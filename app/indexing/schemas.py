import uuid
import json
from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional


class VideoIndexSchema(BaseModel):
    objectID: str = Field(alias='host_id')
    objectType: str = "Video"
    title: Optional[str]
    path: str = Field(alias='host_id')
    # related -> playlist names
        
    @validator("path")
    def set_path(cls, v, values, **kwargs):
        host_id = v
        return f"/videos/{host_id}"


class PlaylistIndexSchema(BaseModel):
    objectID: uuid.UUID = Field(alias='db_id')
    objectType: str = "Playlist"
    title: Optional[str]
    path: str = Field(default='/')
    # related -> host_ids -> Video Title
    
    @model_validator(mode='after')
    def set_defaults(self):
        self.objectID = str(self.objectID)
        self.path = f"/playlists/{self.objectID}"
        return self