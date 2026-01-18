from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.mongodb import get_database
from app.models.class_model import ClassCreate, ClassResponse, ClassInDB
from app.routers.deps import get_current_user
from app.models.user import UserInDB
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[ClassResponse])
async def list_classes(db = Depends(get_database)):
    classes = await db["classes"].find().to_list(1000)
    return classes

@router.post("/", response_model=ClassResponse)
async def create_class(class_in: ClassCreate, current_user: UserInDB = Depends(get_current_user), db = Depends(get_database)):
    if current_user.role not in ["admin", "lecturer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    class_dict = class_in.dict()
    new_class = await db["classes"].insert_one(class_dict)
    created_class = await db["classes"].find_one({"_id": new_class.inserted_id})
    return ClassResponse(**created_class)

@router.post("/{class_id}/enroll")
async def enroll_class(class_id: str, current_user: UserInDB = Depends(get_current_user), db = Depends(get_database)):
    class_obj = await db["classes"].find_one({"_id": ObjectId(class_id)})
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if current_user.id in class_obj.get("enrolled_student_ids", []):
         raise HTTPException(status_code=400, detail="Already enrolled")

    await db["classes"].update_one(
        {"_id": ObjectId(class_id)},
        {"$push": {"enrolled_student_ids": str(current_user.id)}}
    )
    return {"message": "Enrolled successfully"}
