import json
import pathlib
import os
from typing import Optional



from fastapi import FastAPI, Request, Form, HTTPException, APIRouter, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.openapi.utils import get_openapi
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.authentication import requires
from pydantic.error_wrappers import ValidationError
from . import config, db, utils
from .db import get_database
from .config import get_settings

settings = get_settings()

from .indexing.client import (
    update_index,
    search_index
)

from .shortcuts import redirect, render, get_object_or_404
from .users.backends import JWTCookieBackend
from .users.decorators import login_required
from .users.models import User
from .users import auth
from .users.schemas import (
    UserLoginSchema,
    UserSignupSchema
)
from .videos.models import Video
from .videos.routers import router as video_router
from .videos.schemas import VideoCreateSchema, VideoEditSchema

from .playlists.models import Playlist
from .playlists.routers import router as playlist_router
from .playlists.schemas import PlaylistCreateSchema, PlaylistVideoAddSchema

from .watch_events.models import WatchEvent
from .watch_events.routers import router as watch_event_router
from .watch_events.schemas import WatchEventSchema

DB_SESSION = None
BASE_DIR = pathlib.Path(__file__).resolve().parent # app/

# Create API routers for different endpoint groups
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
pages_router = APIRouter(tags=["Pages"])
api_router = APIRouter(prefix="/api", tags=["API"])

# Create security scheme for authentication
security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="Video Membership API",
    description="A YouTube-like video membership platform API with authentication, video management, playlists, and watch progress tracking.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "User authentication operations (login, signup, logout)",
        },
        {
            "name": "Videos",
            "description": "Video management operations (CRUD, watch progress)",
        },
        {
            "name": "Playlists",
            "description": "Playlist management operations (CRUD, add/remove videos)",
        },
        {
            "name": "Watch Events",
            "description": "Video watch progress tracking operations",
        },
        {
            "name": "Pages",
            "description": "HTML page endpoints for legacy support",
        },
        {
            "name": "API",
            "description": "General API endpoints",
        },
    ]
)

# Override the OpenAPI schema to include security
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Don't add global security requirement - only apply to specific endpoints
    # openapi_schema["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Add CORS middleware first (before authentication middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.add_middleware(AuthenticationMiddleware, backend=JWTCookieBackend())

from .handlers import * # noqa


@app.on_event("startup")
async def on_startup():
    # triggered when fastapi starts
    print("hello world")
    global DB_SESSION
    DB_SESSION = db.get_database()
    print("✅ Connected to MongoDB Atlas")


# Page endpoints
@pages_router.get("/", response_class=HTMLResponse)
def homepage(request: Request):
    if request.user.is_authenticated:
        return render(request, "dashboard.html", {}, status_code=200)
    return render(request, "home.html", {})


@pages_router.get("/account", response_class=HTMLResponse)
@login_required
def account_view(request: Request):
    """
    hello world
    """
    context = {}
    return render(request, "account.html", context)

# Authentication endpoints
@auth_router.options("/login")
def login_options_view(request: Request):
    return HTMLResponse("")

@auth_router.post("/login", summary="User Login", description="Authenticate a user with email and password")
async def login_post_view(request: Request, 
    email: str=Form(..., description="User's email address"), 
    password: str = Form(..., description="User's password")
    ):
    try:
        # Perform actual authentication directly without schema validation
        # since the schema expects SecretStr but we get regular string from form
        user_obj = await auth.authenticate(email, password)
        if user_obj is None:
            raise HTTPException(status_code=400, detail={"errors": ["Incorrect credentials, please try again."]})
        
        # Generate session token
        session_id = auth.login(user_obj)
        
        from fastapi.responses import JSONResponse
        
        response_data = {
            "user": {
                "id": user_obj.user_id,
                "email": user_obj.email,
                "username": user_obj.username,
                "is_authenticated": True
            },
            "session_id": session_id
        }
        
        response = JSONResponse(content=response_data)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=settings.session_duration
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=400, detail={"errors": ["An error occurred during login. Please try again."]})


@auth_router.options("/signup")
def signup_options_view(request: Request):
    return HTMLResponse("")

@auth_router.post("/signup", summary="User Registration", description="Create a new user account")
async def signup_post_view(request: Request, 
    email: str=Form(..., description="User's email address"), 
    password: str = Form(..., description="User's password"),
    password_confirm: str = Form(..., description="Password confirmation"),
    username: str = Form(None, description="User's username")
    ):
    try:
        print(f"Signup attempt for email: {email}")
        
        # Basic validation
        if not email or not password or not password_confirm:
            print("Validation failed: missing required fields")
            raise HTTPException(status_code=400, detail={"errors": ["All fields are required."]})
        
        if password != password_confirm:
            print("Validation failed: passwords do not match")
            raise HTTPException(status_code=400, detail={"errors": ["Passwords do not match."]})
        
        print("Basic validation passed")
        
        # Check if user already exists
        try:
            existing_user = await User.by_email(email)
            if existing_user:
                print(f"User already exists: {email}")
                raise HTTPException(status_code=400, detail={"errors": ["User with this email already exists."]})
        except Exception as e:
            print(f"Error checking existing user: {e}")
            raise HTTPException(status_code=500, detail={"errors": [f"Database error: {str(e)}"]})
        
        print("User does not exist, creating new user")
        
        # Create new user
        try:
            user_obj = await User.create_user(email=email, password=password, username=username)
            print(f"User created successfully: {user_obj.email}")
        except Exception as e:
            print(f"Error creating user: {e}")
            raise HTTPException(status_code=500, detail={"errors": [f"Error creating user: {str(e)}"]})
        
        # Generate session token
        try:
            session_id = auth.login(user_obj)
            print("Session token generated")
        except Exception as e:
            print(f"Error generating session token: {e}")
            raise HTTPException(status_code=500, detail={"errors": [f"Error generating session: {str(e)}"]})
        
        from fastapi.responses import JSONResponse
        
        response_data = {
            "user": {
                "id": user_obj.user_id,
                "email": user_obj.email,
                "username": user_obj.username,
                "is_authenticated": True
            },
            "session_id": session_id
        }
        
        response = JSONResponse(content=response_data)
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=settings.session_duration
        )
        
        print("Signup successful, returning response")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected signup error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"errors": [f"Unexpected error: {str(e)}"]})


@auth_router.post("/logout", summary="User Logout", description="Logout the current user")
def logout_post_view(request: Request):
    from fastapi.responses import JSONResponse
    
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="session_id")
    
    return response


@auth_router.options("/user")
def user_options_view(request: Request):
    return HTMLResponse("")

@auth_router.get("/user", summary="Get Current User", description="Get information about the currently authenticated user")
async def get_current_user(request: Request):
    if not request.user.is_authenticated:
        raise HTTPException(status_code=401, detail={"error": "Not authenticated"})
    
    try:
        # Check if user object has required attributes
        if not hasattr(request.user, 'user_id') or not hasattr(request.user, 'email') or not hasattr(request.user, 'username'):
            print(f"User object missing required attributes: {type(request.user)}")
            print(f"Available attributes: {dir(request.user)}")
            raise HTTPException(status_code=500, detail={"error": "Invalid user object"})
        
        return {
            "user": {
                "id": request.user.user_id,
                "email": request.user.email,
                "username": request.user.username,
                "is_authenticated": True
            }
        }
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        print(f"User object type: {type(request.user)}")
        print(f"User object attributes: {dir(request.user)}")
        raise HTTPException(status_code=500, detail={"error": f"Authentication error: {str(e)}"})





# API endpoints are now handled by individual routers
# The routers have been updated to include JSON API endpoints alongside HTML endpoints


# Utility endpoints
@api_router.post('/update-index', response_class=HTMLResponse)
async def htmx_update_index_view(request:Request):
    count = await update_index()
    return HTMLResponse(f"({count}) Refreshed")


@api_router.get("/search", response_class=HTMLResponse)
def search_detail_view(request:Request, q:Optional[str] = None):
    query = None
    context = {}
    if q is not None:
        query = q
        results = search_index(query)
        hits = results.get('hits') or []
        num_hits = results.get('nbHits')
        context = {
            "query": query,
            "hits": hits,
            "num_hits": num_hits
        }
    return render(request, "search/detail.html", context)


# Include all routers (after all endpoints are defined)
app.include_router(auth_router)
app.include_router(pages_router)
app.include_router(api_router)
app.include_router(playlist_router)
app.include_router(video_router)
app.include_router(watch_event_router)
