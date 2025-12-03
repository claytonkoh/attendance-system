from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.pyobjectid import PyObjectId
from bson import ObjectId

class AttendanceBase(BaseModel):
    class_id: str
    student_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "present" # present, late, absent
    verification_method: str # face_recognition

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceInDB(AttendanceBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    confidence_score: float # Face match confidence
    liveness_score: float # Liveness check score
    snapshot_url: Optional[str] = None # URL of the selfie taken

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
