import uuid
from typing import Optional
from pydantic import Field, EmailStr
from app.models.base import BaseMongoModel, PyObjectId
from app.db import get_database
from . import exceptions, security, validators


class User(BaseMongoModel):
    email: EmailStr = Field(..., unique=True)
    user_id: str = Field(default_factory=lambda: str(uuid.uuid1()))
    username: str = Field(default="")
    password: str = Field(...)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "username": "user",
                "password": "hashed_password"
            }
        }
    }

    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        return f"User(email={self.email}, username={self.username}, user_id={self.user_id})"

    def set_password(self, pw: str) -> bool:
        pw_hash = security.generate_hash(pw)
        self.password = pw_hash
        return True

    def verify_password(self, pw_str: str) -> bool:
        pw_hash = self.password
        verified, _ = security.verify_hash(pw_hash, pw_str)
        return verified

    @classmethod
    async def create_user(cls, email: str, password: str = None, username: str = None):
        """Create a new user"""
        db = get_database()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise exceptions.UserHasAccountException("User already has account.")
        
        # Validate email
        valid, msg, email = validators._validate_email(email)
        if not valid:
            raise exceptions.InvalidEmailException(f"Invalid email: {msg}")
        
        # Create user
        user_data = {
            "email": email,
            "user_id": str(uuid.uuid1()),
            "username": username or email.split('@')[0],  # Use email prefix as default username
            "password": ""
        }
        
        user = cls(**user_data)
        if password:
            user.set_password(password)
        
        # Save to database
        result = await db.users.insert_one(user.to_mongo())
        user.id = result.inserted_id
        
        return user

    @classmethod
    async def check_exists(cls, user_id: str) -> bool:
        """Check if user exists by user_id"""
        db = get_database()
        user = await db.users.find_one({"user_id": user_id})
        return user is not None
    
    @classmethod
    async def by_user_id(cls, user_id: str = None):
        """Get user by user_id"""
        if user_id is None:
            return None
        
        db = get_database()
        user_data = await db.users.find_one({"user_id": user_id})
        
        if user_data:
            # Convert ObjectId to string for Pydantic model
            user_data['id'] = str(user_data['_id'])
            del user_data['_id']
            return cls(**user_data)
        return None

    @classmethod
    async def by_email(cls, email: str):
        """Get user by email"""
        db = get_database()
        user_data = await db.users.find_one({"email": email})
        
        if user_data:
            # Convert ObjectId to string for Pydantic model
            user_data['id'] = str(user_data['_id'])
            del user_data['_id']
            return cls(**user_data)
        return None