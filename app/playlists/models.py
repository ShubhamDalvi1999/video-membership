from datetime import datetime
import uuid
from typing import List, Optional
from pydantic import Field
from app.models.base import BaseMongoModel, PyObjectId
from app.db import get_database
from app.videos.models import Video


class Playlist(BaseMongoModel):
    db_id: str = Field(default_factory=lambda: str(uuid.uuid1()))
    user_id: str = Field(...)
    updated: datetime = Field(default_factory=datetime.utcnow)
    host_ids: List[str] = Field(default_factory=list)  # ["abc123"]
    title: str = Field(...)

    model_config = {
        "json_schema_extra": {
            "example": {
                "db_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "title": "My Playlist",
                "host_ids": ["abc123", "def456"]
            }
        }
    }

    @property
    def path(self):
        return f"/playlists/{self.db_id}"

    async def add_host_ids(self, host_ids: List[str] = [], replace_all: bool = False):
        """Add host IDs to playlist"""
        if not isinstance(host_ids, list):
            return False
        
        if replace_all:
            self.host_ids = host_ids
        else:
            self.host_ids += host_ids
        
        self.updated = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        # Update in database
        db = get_database()
        await db.playlists.update_one(
            {"_id": self.id},
            {"$set": {"host_ids": self.host_ids, "updated": self.updated, "updated_at": self.updated_at}}
        )
        
        return True

    async def get_videos(self):
        """Get videos in this playlist"""
        videos = []
        for host_id in self.host_ids:
            try:
                video_obj = await Video.get_by_host_id(host_id)
            except:
                video_obj = None
            if video_obj is not None:
                videos.append(video_obj)
        return videos

    @classmethod
    async def create_playlist(cls, user_id: str, title: str, host_ids: List[str] = None):
        """Create a new playlist"""
        db = get_database()
        
        playlist_data = {
            "db_id": str(uuid.uuid1()),
            "user_id": user_id,
            "title": title,
            "host_ids": host_ids or []
        }
        
        playlist = cls(**playlist_data)
        
        # Save to database
        result = await db.playlists.insert_one(playlist.to_mongo())
        playlist.id = result.inserted_id
        
        return playlist

    @classmethod
    async def get_by_user_id(cls, user_id: str):
        """Get playlists by user_id"""
        db = get_database()
        cursor = db.playlists.find({"user_id": user_id})
        playlists = []
        
        async for playlist_data in cursor:
            playlists.append(cls(**playlist_data))
        
        return playlists