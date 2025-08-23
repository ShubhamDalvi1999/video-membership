import uuid
from pydantic import (
    BaseModel,
    validator,
    model_validator
)

from app.videos.extractors import extract_video_id
from app.videos.models import Video

from .models import Playlist

class PlaylistCreateSchema(BaseModel):
    title: str # user generated
    user_id: uuid.UUID # request.session user_id


class PlaylistVideoAddSchema(BaseModel):
    url: str # user generated
    title: str # user generated
    user_id: uuid.UUID # request.session user_id
    playlist_id: uuid.UUID  # Playlist db_id

    @validator("url")
    def validate_youtube_url(cls, v, values, **kwargs):
        url = v
        video_id = extract_video_id(url)
        if video_id is None:
            raise ValueError(f"{url} is not a valid YouTube URL")
        return url

    @validator("playlist_id")
    def validate_playlist_id(cls, v, values, **kwargs):
        # Note: This validation will need to be done in the route handler
        # since Playlist operations are now async and we can't call async methods
        # in a validator. The actual validation will happen in the route.
        return v

    @model_validator(mode='after')
    def validate_data(self):
        url = self.url
        title = self.title
        playlist_id = self.playlist_id
        user_id = self.user_id
        
        if url is None:
            raise ValueError("A valid url is required.")
        
        # Note: This validation will need to be done in the route handler
        # since Video.get_or_create and Playlist operations are now async
        # and we can't call async methods in a validator.
        # The actual validation will happen in the route.
        
        return self


        