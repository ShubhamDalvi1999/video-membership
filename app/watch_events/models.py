import uuid
from datetime import datetime
from typing import Optional
from pydantic import Field
from app.models.base import BaseMongoModel, PyObjectId
from app.db import get_database


class WatchEvent(BaseMongoModel):
    host_id: str = Field(...)
    event_id: str = Field(default_factory=lambda: str(uuid.uuid1()))
    user_id: str = Field(...)
    path: str = Field(...)
    start_time: float = Field(...)
    end_time: float = Field(...)
    duration: float = Field(...)
    complete: bool = Field(default=False)

    model_config = {
        "json_schema_extra": {
            "example": {
                "host_id": "dQw4w9WgXcQ",
                "event_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "path": "/videos/dQw4w9WgXcQ",
                "start_time": 0.0,
                "end_time": 120.5,
                "duration": 300.0,
                "complete": False
            }
        }
    }


    @property
    def completed(self):
        return (self.duration * 0.97) < self.end_time

    @classmethod
    async def get_resume_time(cls, host_id: str, user_id: str):
        """Get resume time for a video"""
        try:
            resume_time = 0
            db = get_database()
            
            print(f"Looking for watch events for host_id: {host_id}, user_id: {user_id}")
            
            # Get the most recent watch event for this video and user
            watch_event = await db.watch_events.find_one(
                {"host_id": host_id, "user_id": user_id},
                sort=[("created_at", -1)]  # Most recent first
            )
            
            print(f"Found watch event: {watch_event is not None}")
            
            if watch_event:
                # Convert ObjectId to string for Pydantic model
                watch_event['id'] = str(watch_event['_id'])
                del watch_event['_id']
                obj = cls(**watch_event)
                
                # If video is not complete, resume from where they left off
                if not obj.complete and not obj.completed:
                    resume_time = obj.end_time
                    print(f"Video not complete, resume time set to: {resume_time}")
                else:
                    print(f"Video is complete, resume time: 0")
            else:
                print(f"No watch events found for this video/user combination")
            
            return resume_time
        except Exception as e:
            print(f"Error in get_resume_time: {e}")
            return 0

    @classmethod
    async def create_watch_event(cls, host_id: str, user_id: str, path: str, 
                                start_time: float, end_time: float, duration: float, 
                                complete: bool = False):
        """Create a new watch event"""
        try:
            db = get_database()
            
            print(f"Creating watch event - host_id: {host_id}, user_id: {user_id}, end_time: {end_time}")
            
            watch_event_data = {
                "host_id": host_id,
                "event_id": str(uuid.uuid1()),
                "user_id": user_id,
                "path": path,
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "complete": complete
            }
            
            watch_event = cls(**watch_event_data)
            
            # Save to database
            result = await db.watch_events.insert_one(watch_event.to_mongo())
            watch_event.id = result.inserted_id
            
            print(f"Watch event created with ID: {result.inserted_id}")
            
            return watch_event
        except Exception as e:
            print(f"Error creating watch event: {e}")
            raise e
