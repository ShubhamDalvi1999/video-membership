import motor.motor_asyncio
from pymongo import MongoClient
from . import config

settings = config.get_settings()

# Global database connection
_db = None
_client = None

def get_database():
    """
    Get MongoDB database instance
    """
    global _db, _client
    
    if _db is None:
        # Check if we have a proper MongoDB URI
        if not settings.mongodb_uri or settings.mongodb_uri == "mongodb://localhost:27017":
            print("⚠️  Warning: Using default MongoDB URI. Please set MONGODB_URI in your .env file")
            print("   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video_membership")
        
        _client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
        _db = _client[settings.mongodb_database]
    
    return _db

def get_sync_database():
    """
    Get synchronous MongoDB database instance for operations that need it
    """
    client = MongoClient(settings.mongodb_uri)
    return client[settings.mongodb_database]

def close_connection():
    """
    Close database connection
    """
    global _db, _client
    if _client:
        _client.close()
        _db = None
        _client = None

