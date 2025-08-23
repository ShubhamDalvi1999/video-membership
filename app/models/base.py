"""
Base MongoDB model for the application
"""
from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.with_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
            serialization=core_schema.str_schema()
        )

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    def __str__(self):
        return str(self.binary)


class BaseMongoModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str, PyObjectId: str},
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z"
            }
        }
    }

    def model_dump(self, *args, **kwargs):
        kwargs.pop('exclude_none', None)
        data = super().model_dump(*args, exclude_none=True, **kwargs)
        # Ensure ObjectId is converted to string
        if 'id' in data and data['id']:
            data['id'] = str(data['id'])
        return data

    def dict(self, *args, **kwargs):
        # Backward compatibility
        return self.model_dump(*args, **kwargs)

    def to_mongo(self) -> Dict[str, Any]:
        """Convert to MongoDB document format"""
        data = self.model_dump(exclude={'id'})
        if self.id:
            data['_id'] = self.id
        return data
