import uuid
from datetime import datetime
from typing import Optional
from pydantic import Field
from app.models.base import BaseMongoModel, PyObjectId
from app.db import get_database
from app.users.exceptions import InvalidUserIDException
from app.users.models import User
from app.shortcuts import templates

from .exceptions import (
    InvalidYouTubeVideoURLException, 
    VideoAlreadyAddedException
)
from .extractors import extract_video_id


class Video(BaseMongoModel):
    host_id: str = Field(..., unique=True)  # YouTube, Vimeo video ID
    db_id: str = Field(default_factory=lambda: str(uuid.uuid1()))
    host_service: str = Field(default='youtube')
    title: str = Field(...)
    url: str = Field(...)
    user_id: str = Field(...)

    model_config = {
        "json_schema_extra": {
            "example": {
                "host_id": "dQw4w9WgXcQ",
                "db_id": "123e4567-e89b-12d3-a456-426614174000",
                "host_service": "youtube",
                "title": "Sample Video",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "user_id": "123e4567-e89b-12d3-a456-426614174001"
            }
        }
    }


    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        return f"Video(title={self.title}, host_id={self.host_id}, host_service={self.host_service})"

    def render(self):
        basename = self.host_service # youtube, vimeo
        template_name = f"videos/renderers/{basename}.html"
        context = {"host_id": self.host_id}
        t = templates.get_template(template_name)
        return t.render(context)

    def as_data(self):
        return {f"{self.host_service}_id": self.host_id, "path": self.path, "title": self.title}

    @property
    def path(self):
        return f"/videos/{self.host_id}"
    
    @classmethod
    async def get_or_create(cls, url: str, user_id: str = None, **kwargs):
        """Get existing video or create new one"""
        host_id = extract_video_id(url)
        if not host_id:
            raise InvalidYouTubeVideoURLException("Invalid YouTube Video URL")
        
        db = get_database()
        
        # Try to find existing video
        existing_video = await db.videos.find_one({"host_id": host_id})
        if existing_video:
            return cls(**existing_video), False
        
        # Create new video
        new_video = await cls.add_video(url, user_id=user_id, **kwargs)
        return new_video, True

    async def update_video_url(self, url: str):
        """Update video URL and host_id"""
        host_id = extract_video_id(url)
        if not host_id:
            return None
        
        self.url = url
        self.host_id = host_id
        self.updated_at = datetime.utcnow()
        
        # Update in database
        db = get_database()
        await db.videos.update_one(
            {"_id": self.id},
            {"$set": {"url": url, "host_id": host_id, "updated_at": self.updated_at}}
        )
        
        return url

    @classmethod
    async def add_video(cls, url: str, user_id: str = None, **kwargs):
        """Add a new video"""
        host_id = extract_video_id(url)
        if host_id is None:
            raise InvalidYouTubeVideoURLException("Invalid YouTube Video URL")
        
        print(f"Adding video: url={url}, host_id={host_id}, user_id={user_id}")
        
        # Check if user exists
        user_exists = await User.check_exists(user_id)
        if not user_exists:
            print(f"User not found: {user_id}")
            raise InvalidUserIDException("Invalid user_id")
        
        # Check if video already exists
        db = get_database()
        existing_video = await db.videos.find_one({"host_id": host_id})
        if existing_video:
            print(f"Video already exists: {host_id}")
            raise VideoAlreadyAddedException("Video already added")
        
        # Create video data
        video_data = {
            "host_id": host_id,
            "db_id": str(uuid.uuid1()),
            "host_service": "youtube",
            "title": kwargs.get("title", ""),
            "url": url,
            "user_id": user_id
        }
        
        print(f"Creating video with data: {video_data}")
        
        video = cls(**video_data)
        
        # Save to database
        result = await db.videos.insert_one(video.to_mongo())
        video.id = result.inserted_id
        
        print(f"Video created successfully: {video.host_id}")
        return video

    @classmethod
    async def get_by_host_id(cls, host_id: str):
        """Get video by host_id"""
        db = get_database()
        video_data = await db.videos.find_one({"host_id": host_id})
        
        if video_data:
            # Convert ObjectId to string for Pydantic model
            video_data['id'] = str(video_data['_id'])
            del video_data['_id']
            return cls(**video_data)
        return None

    async def delete(self):
        """Delete the video from database"""
        db = get_database()
        result = await db.videos.delete_one({"host_id": self.host_id})
        return result.deleted_count > 0



# class PrivateVideo(Video):
# pass