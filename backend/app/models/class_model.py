from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from app.models.pyobjectid import PyObjectId
from bson import ObjectId

class ClassBase(BaseModel):
    name: str
    code: str
    lecturer_id: str 
    schedule: str 

class ClassCreate(ClassBase):
    pass

class ClassInDB(ClassBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    enrolled_student_ids: List[str] = [] 

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

class ClassResponse(ClassBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    enrolled_student_ids: List[str] = []

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
