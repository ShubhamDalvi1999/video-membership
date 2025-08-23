import asyncio

# Optional Algolia import - app will work without it
try:
    from algoliasearch.search_client import SearchClient
    ALGOLIA_AVAILABLE = True
except ImportError:
    print("⚠️  Algolia not installed. Search functionality will be limited.")
    print("   Install with: pip install algoliasearch>=3.0.0")
    ALGOLIA_AVAILABLE = False
    SearchClient = None

from app import config
from app.db import get_database

from app.playlists.models import Playlist
from app.videos.models import Video

from .schemas import (
    PlaylistIndexSchema,
    VideoIndexSchema
)

settings = config.get_settings()

def get_index():
    """Get Algolia search index"""
    if not ALGOLIA_AVAILABLE:
        print("⚠️  Algolia not available. Search functionality will be limited.")
        return None
        
    try:
        if not settings.algolia_app_id or not settings.algolia_api_key:
            print("⚠️  Algolia not configured. Search functionality will be limited.")
            return None
            
        client = SearchClient.create(
                settings.algolia_app_id, 
                settings.algolia_api_key
        )
        index = client.init_index(settings.algolia_index_name)
        return index
    except Exception as e:
        print(f"⚠️  Algolia connection failed: {e}")
        return None


async def get_dataset():
    """Get dataset from MongoDB collections"""
    db = get_database()
    
    # Get playlists
    playlists_cursor = db.playlists.find({})
    playlists_dataset = []
    async for playlist_data in playlists_cursor:
        try:
            playlist_schema = PlaylistIndexSchema(**playlist_data)
            playlists_dataset.append(playlist_schema.model_dump())
        except Exception as e:
            print(f"Error processing playlist: {e}")
    
    # Get videos
    videos_cursor = db.videos.find({})
    videos_dataset = []
    async for video_data in videos_cursor:
        try:
            video_schema = VideoIndexSchema(**video_data)
            videos_dataset.append(video_schema.model_dump())
        except Exception as e:
            print(f"Error processing video: {e}")
    
    dataset = videos_dataset + playlists_dataset
    return dataset

async def update_index():
    """Update Algolia search index with MongoDB data"""
    index = get_index()
    if not index:
        print("⚠️  Algolia not available, skipping index update")
        return 0
        
    dataset = await get_dataset()
    
    if dataset:
        try:
            idx_resp = index.save_objects(dataset).wait()
            count = len(list(idx_resp)[0]['objectIDs'])
            return count
        except Exception as e:
            print(f"⚠️  Failed to update Algolia index: {e}")
            return 0
    return 0


def search_index(query):
    """Search Algolia index"""
    index = get_index()
    if not index:
        print("⚠️  Algolia not available, returning empty results")
        return {"hits": [], "nbHits": 0}
    
    try:
        return index.search(query)
    except Exception as e:
        print(f"⚠️  Search failed: {e}")
        return {"hits": [], "nbHits": 0}