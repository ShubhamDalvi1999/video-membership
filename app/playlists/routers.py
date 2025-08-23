from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer

from app import utils
from app.shortcuts import get_object_or_404
from app.db import get_database


from app.watch_events.models import WatchEvent
from .models import Playlist
from .schemas import PlaylistCreateSchema, PlaylistVideoAddSchema

# Security scheme for authentication
security = HTTPBearer(auto_error=False)


router = APIRouter(
    prefix='/playlists',
    tags=["Playlists"]
)


# HTML create endpoints removed - functionality replaced by JSON API endpoints


# HTML list endpoint removed - functionality replaced by JSON API endpoints

# host_id='playlist-1'
# f"{host_id} is cool"

# HTML detail endpoint removed - functionality replaced by JSON API endpoints 




# HTML add video view endpoint removed - functionality replaced by JSON API endpoints
    


# HTML add video post endpoint removed - functionality replaced by JSON API endpoints



# HTML remove video endpoint removed - functionality replaced by JSON API endpoints


# JSON API endpoints for React frontend
@router.get("/api/playlists", summary="Get All Playlists", description="Retrieve a list of all playlists")
async def api_playlist_list_view(request: Request):
    # Get playlists from MongoDB - public endpoint (no authentication required)
    db = get_database()
    cursor = db.playlists.find({}).limit(100)
    playlists = []
    async for playlist_data in cursor:
        # Convert ObjectId to string for Pydantic model
        playlist_data['id'] = str(playlist_data['_id'])
        del playlist_data['_id']
        playlists.append(Playlist(**playlist_data))
    
    return {
        "playlists": [playlist.model_dump() for playlist in playlists],
        "count": len(playlists)
    }


@router.get("/api/playlists/create", summary="Get Playlist Create Form", description="Get playlist creation form data")
async def api_playlist_create_form_view(
    request: Request,
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    
    return {
        "message": "Playlist creation form ready",
        "user_id": request.user.username
    }


@router.get("/api/playlists/{db_id}", summary="Get Playlist by ID", description="Retrieve a specific playlist by its ID")
async def api_playlist_detail_view(request: Request, db_id: str):
    # Public endpoint (no authentication required)
    obj = await get_object_or_404(Playlist, db_id=db_id)
    videos = await obj.get_videos()
    
    playlist_data = obj.model_dump()
    playlist_data['videos'] = [video.model_dump() for video in videos]
    
    return playlist_data


@router.get("/api/playlists/{db_id}/add-video", summary="Get Add Video to Playlist Form", description="Get add video to playlist form data")
async def api_playlist_add_video_form_view(
    request: Request, 
    db_id: str,
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    obj = await get_object_or_404(Playlist, db_id=db_id)
    
    # Ensure user can only add videos to their own playlists
    if obj.user_id != request.user.username:
        raise HTTPException(status_code=403, detail={"error": "You can only add videos to your own playlists"})
    
    return {
        "message": "Add video to playlist form ready",
        "playlist": obj.model_dump(),
        "user_id": request.user.username
    }


@router.post("/api/playlists", summary="Create Playlist", description="Create a new playlist")
async def api_playlist_create_view(
    request: Request, 
    title: str=Form(..., description="Playlist title"),
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    raw_data = {
        "title": title,
        "user_id": request.user.username
    }
    data, errors = utils.valid_schema_data_or_error(raw_data, PlaylistCreateSchema)
    
    if len(errors) > 0:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    try:
        playlist = await Playlist.create_playlist(
            user_id=request.user.username,
            title=title
        )
        return playlist.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": f"Error creating playlist: {str(e)}"})


@router.post("/api/playlists/{db_id}/videos", summary="Add Video to Playlist", description="Add a video to an existing playlist")
async def api_playlist_add_video_view(
    request: Request, 
    db_id: str,
    title: str=Form(..., description="Video title"), 
    url: str=Form(..., description="Video URL"),
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    raw_data = {
        "title": title,
        "url": url,
        "user_id": request.user.username,
        "playlist_id": db_id
    }
    data, errors = utils.valid_schema_data_or_error(raw_data, PlaylistVideoAddSchema)
    
    if len(errors) > 0:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    try:
        # Get the playlist first to check ownership
        playlist = await get_object_or_404(Playlist, db_id=db_id)
        
        # Ensure user can only add videos to their own playlists
        if playlist.user_id != request.user.username:
            raise HTTPException(status_code=403, detail={"error": "You can only add videos to your own playlists"})
        
        # Create the video
        from app.videos.models import Video
        video = await Video.add_video(
            url=url,
            user_id=request.user.username,
            title=title
        )
        
        # Add video to playlist
        await playlist.add_host_ids(host_ids=[video.host_id])
        
        return {
            "message": "Video added to playlist successfully",
            "video": video.model_dump(),
            "playlist": playlist.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": f"Error adding video to playlist: {str(e)}"})


@router.delete("/api/playlists/{db_id}/videos/{host_id}", summary="Remove Video from Playlist", description="Remove a video from a playlist")
async def api_playlist_remove_video_view(
    request: Request, 
    db_id: str, 
    host_id: str,
    token: str = Depends(security)
):
    # Check authentication manually
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    try:
        obj = await get_object_or_404(Playlist, db_id=db_id)
        
        # Ensure user can only remove videos from their own playlists
        if obj.user_id != request.user.username:
            raise HTTPException(status_code=403, detail={"error": "You can only remove videos from your own playlists"})
        
        # Remove the host_id from the playlist
        host_ids = obj.host_ids
        if host_id in host_ids:
            host_ids.remove(host_id)
            await obj.add_host_ids(host_ids=host_ids, replace_all=True)
            return {"message": "Video removed from playlist successfully"}
        else:
            raise HTTPException(status_code=404, detail={"error": "Video not found in playlist"})
    except Exception as e:
        raise HTTPException(status_code=400, detail={"error": f"Error removing video from playlist: {str(e)}"})