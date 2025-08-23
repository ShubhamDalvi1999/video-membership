from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer

from app import utils
from app.shortcuts import get_object_or_404
from app.db import get_database


from app.watch_events.models import WatchEvent
from .models import Video
from .schemas import (
    VideoCreateSchema,
    VideoEditSchema)

# Security scheme for authentication
security = HTTPBearer(auto_error=False)


router = APIRouter(
    prefix='/videos',
    tags=["Videos"]
)



# HTML create endpoints removed - functionality replaced by JSON API endpoints


# HTML list endpoint removed - functionality replaced by JSON API endpoints

# host_id='video-1'
# f"{host_id} is cool"

# HTML detail endpoint removed - functionality replaced by JSON API endpoints


# HTML edit endpoints removed - functionality replaced by JSON API endpoints



# HTML htmx edit view endpoint removed - functionality replaced by JSON API endpoints 



# HTML htmx edit post endpoint removed - functionality replaced by JSON API endpoints


# JSON API endpoints for React frontend
@router.get("/api/videos", summary="Get All Videos", description="Retrieve a list of all videos")
async def api_video_list_view(request: Request):
    # Get videos from MongoDB - public endpoint (no authentication required)
    db = get_database()
    cursor = db.videos.find({}).limit(100)
    videos = []
    async for video_data in cursor:
        # Convert ObjectId to string for Pydantic model
        if '_id' in video_data:
            video_data['id'] = str(video_data['_id'])
            del video_data['_id']
        
        # Ensure all datetime fields are properly formatted
        for field in ['created_at', 'updated_at']:
            if field in video_data and hasattr(video_data[field], 'isoformat'):
                video_data[field] = video_data[field].isoformat()
        
        try:
            video = Video(**video_data)
            # Convert to dict with proper serialization
            video_dict = video.model_dump()
            videos.append(video_dict)
        except Exception as e:
            print(f"Error creating Video object: {e}")
            print(f"Data: {video_data}")
            continue
    
    return {
        "videos": videos,
        "count": len(videos)
    }


@router.get("/api/videos/create", summary="Get Video Create Form", description="Get video creation form data")
async def api_video_create_form_view(
    request: Request, 
    playlist_id: str = None,
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    
    return {
        "message": "Video creation form ready",
        "user_id": request.user.username,
        "playlist_id": playlist_id
    }


@router.get("/api/videos/{host_id}", summary="Get Video by ID", description="Retrieve a specific video by its host ID")
async def api_video_detail_view(request: Request, host_id: str):
    # Public endpoint (no authentication required) - but resume time only available for authenticated users
    obj = await get_object_or_404(Video, host_id=host_id)
    start_time = 0
    if request.user.is_authenticated:
        user_id = request.user.username
        start_time = await WatchEvent.get_resume_time(host_id, user_id)
    
    video_data = obj.model_dump()
    video_data['resume_time'] = start_time
    
    return video_data


@router.get("/api/videos/{host_id}/edit", summary="Get Video Edit Form", description="Get video edit form data")
async def api_video_edit_form_view(
    request: Request, 
    host_id: str,
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    
    obj = await get_object_or_404(Video, host_id=host_id)
    
    # Ensure user can only edit their own videos
    if obj.user_id != request.user.username:
        raise HTTPException(status_code=403, detail={"error": "You can only edit your own videos"})
    
    return {
        "message": "Video edit form ready",
        "video": obj.model_dump(),
        "user_id": request.user.username
    }


@router.post("/api/videos", summary="Create Video", description="Create a new video")
async def api_video_create_view(
    request: Request, 
    title: str=Form(..., description="Video title"), 
    url: str=Form(..., description="Video URL"),
    playlist_id: str=Form(None, description="Optional playlist ID to add video to"),
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    
    raw_data = {
        "title": title,
        "url": url,
        "user_id": request.user.user_id  # Use user_id instead of username
    }
    
    print(f"Creating video with data: {raw_data}")
    
    data, errors = utils.valid_schema_data_or_error(raw_data, VideoCreateSchema)
    
    if len(errors) > 0:
        print(f"Validation errors: {errors}")
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    try:
        video = await Video.add_video(
            url=url,
            user_id=request.user.user_id,  # Use user_id instead of username
            title=title
        )
        
        # If playlist_id is provided, add video to playlist
        if playlist_id:
            from app.playlists.models import Playlist
            playlist = await get_object_or_404(Playlist, db_id=playlist_id)
            
            # Ensure user can only add videos to their own playlists
            if playlist.user_id != request.user.user_id:  # Use user_id instead of username
                raise HTTPException(status_code=403, detail={"error": "You can only add videos to your own playlists"})
            
            await playlist.add_host_ids(host_ids=[video.host_id])
            
            return {
                "message": "Video created and added to playlist successfully",
                "video": video.model_dump(),
                "playlist": playlist.model_dump()
            }
        
        return video.model_dump()
    except Exception as e:
        print(f"Error creating video: {e}")
        raise HTTPException(status_code=400, detail={"error": f"Error creating video: {str(e)}"})


@router.put("/api/videos/{host_id}", summary="Update Video", description="Update an existing video")
async def api_video_update_view(
    request: Request, 
    host_id: str,
    title: str=Form(..., description="Video title"), 
    url: str=Form(..., description="Video URL"),
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    obj = await get_object_or_404(Video, host_id=host_id)
    
    # Ensure user can only update their own videos
    if obj.user_id != request.user.username:
        raise HTTPException(status_code=403, detail={"error": "You can only update your own videos"})
    
    raw_data = {
        "title": title,
        "url": url,
        "user_id": request.user.username
    }
    data, errors = utils.valid_schema_data_or_error(raw_data, VideoEditSchema)
    
    if len(errors) > 0:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    obj.title = data.get('title') or obj.title
    await obj.update_video_url(url)
    
    return obj.model_dump()


@router.delete("/api/videos/{host_id}", summary="Delete Video", description="Delete a video")
async def api_video_delete_view(
    request: Request, 
    host_id: str,
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    obj = await get_object_or_404(Video, host_id=host_id)
    
    # Ensure user can only delete their own videos
    if obj.user_id != request.user.username:
        raise HTTPException(status_code=403, detail={"error": "You can only delete your own videos"})
    
    deleted = await obj.delete()
    
    if deleted:
        return {"message": "Video deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail={"error": "Failed to delete video"})