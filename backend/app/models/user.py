from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from app.models.pyobjectid import PyObjectId
from bson import ObjectId

class UserBase(BaseModel):
    name: str
    email: EmailStr
    student_id: Optional[str] = None
    major: Optional[str] = None
    role: str = "student" # student, lecturer, admin

class UserCreate(UserBase):
    password: str
    profile_image_url: Optional[str] = None # URL to stored image

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str
    face_embedding: Optional[List[float]] = None # Stored embedding from ML service
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
