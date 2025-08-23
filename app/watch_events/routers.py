from fastapi import APIRouter, Request, HTTPException

from .models import WatchEvent
from .schemas import WatchEventSchema

router = APIRouter(
    prefix='/watch-events',
    tags=["Watch Events"]
)

# JSON API endpoints for React frontend
@router.post("/api/watch-events", summary="Create Watch Event", description="Track video watch progress")
async def api_watch_event_view(
    request: Request, 
    watch_event: WatchEventSchema
):
    # Check authentication using session
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    
    print(f"Creating watch event for user: {request.user.user_id}")
    
    cleaned_data = watch_event.model_dump()
    data = cleaned_data.copy()
    data.update({
        "user_id": request.user.user_id  # Use user_id instead of username
    })
    
    try:
        await WatchEvent.create_watch_event(
            host_id=data['host_id'],
            user_id=data['user_id'],
            path=data['path'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            duration=data['duration'],
            complete=data.get('complete', False)
        )
        print(f"Watch event created successfully for video: {data['host_id']}")
        return {"message": "Watch event recorded successfully"}
    except Exception as e:
        print(f"Error creating watch event: {e}")
        raise HTTPException(status_code=400, detail={"error": f"Error recording watch event: {str(e)}"})


@router.get("/api/watch-events/{host_id}/resume", summary="Get Resume Time", description="Get the resume time for a video")
async def api_watch_event_resume_view(
    request: Request, 
    host_id: str
):
    # Check authentication using session
    if not request.user.is_authenticated:
        print(f"User not authenticated for resume request")
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    
    print(f"Getting resume time for video: {host_id}, user: {request.user.user_id}")
    
    user_id = request.user.user_id  # Use user_id instead of username
    try:
        resume_time = await WatchEvent.get_resume_time(host_id, user_id)
        print(f"Resume time for {host_id}: {resume_time}")
        
        return {
            "host_id": host_id,
            "resume_time": resume_time
        }
    except Exception as e:
        print(f"Error getting resume time: {e}")
        raise HTTPException(status_code=500, detail={"error": f"Error getting resume time: {str(e)}"})