from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.db.mongodb import get_database
from app.routers.deps import get_current_user
from app.models.user import UserInDB
from app.services.ml_service import ml_service
from app.services.ocr_service import ocr_service
from app.models.attendance import AttendanceInDB
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/verify-id")
async def verify_id(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    content = await file.read()
    is_valid = ocr_service.verify_id_card(content, current_user.student_id)
    if not is_valid:
        raise HTTPException(status_code=400, detail="ID Card verification failed")
    return {"message": "ID Card verified"}

@router.post("/verify-face")
async def verify_face(
    class_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    # Check enrollment
    class_obj = await db["classes"].find_one({"_id": ObjectId(class_id)})
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if str(current_user.id) not in class_obj.get("enrolled_student_ids", []):
         raise HTTPException(status_code=403, detail="Not enrolled in this class")

    content = await file.read()
    
    # 1. Liveness Check
    liveness_score = ml_service.check_liveness(content)
    if liveness_score < 0.8: # Threshold
         raise HTTPException(status_code=400, detail="Liveness check failed. Please try again.")

    # 2. Face Verification
    result = ml_service.verify_face(content, current_user.face_embedding)
    if not result["verified"]:
         raise HTTPException(status_code=400, detail="Face verification failed")

    # 3. Mark Attendance
    attendance_record = {
        "class_id": class_id,
        "student_id": str(current_user.id),
        "timestamp": datetime.utcnow(),
        "status": "present",
        "verification_method": "face_recognition",
        "confidence_score": result["confidence"],
        "liveness_score": liveness_score,
        "snapshot_url": "path/to/snapshot" # Save file and put path here
    }
    
    await db["attendance"].insert_one(attendance_record)
    return {"message": "Attendance marked successfully"}
