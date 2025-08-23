import uuid
from pydantic import (
    BaseModel,
    validator,
    model_validator
)

from app.users.exceptions import InvalidUserIDException


from .exceptions import (
    InvalidYouTubeVideoURLException, 
    VideoAlreadyAddedException
)
from .extractors import extract_video_id
from .models import Video

class VideoCreateSchema(BaseModel):
    url: str # user generated
    title: str # user generated
    user_id: str # request.session user_id (changed from uuid.UUID to str)

    @validator("url")
    def validate_youtube_url(cls, v, values, **kwargs):
        url = v
        video_id = extract_video_id(url)
        if video_id is None:
            raise ValueError(f"{url} is not a valid YouTube URL")
        return url

    @model_validator(mode='after')
    def validate_data(self):
        url = self.url
        title = self.title
        user_id = self.user_id
        
        if url is None:
            raise ValueError("A valid url is required.")
        
        if not title or not title.strip():
            raise ValueError("A valid title is required.")
        
        if not user_id:
            raise ValueError("A valid user_id is required.")
        
        # Note: This validation will need to be done in the route handler
        # since Video.add_video is now async and we can't call async methods
        # in a validator. The actual validation will happen in the route.
        
        return self


        
    

class VideoEditSchema(BaseModel):
    url: str # user generated
    title: str # user generated

    @validator("url")
    def validate_youtube_url(cls, v, values, **kwargs):
        url = v
        video_id = extract_video_id(url)
        if video_id is None:
            raise ValueError(f"{url} is not a valid YouTube URL")
        return url
