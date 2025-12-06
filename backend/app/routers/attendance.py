from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.db.mongodb import get_database
from app.routers.deps import get_current_user
from app.models.user import UserInDB
from app.services.ml_service import ml_service
from app.models.attendance import AttendanceInDB
from datetime import datetime
from bson import ObjectId

router = APIRouter()

# ❌ REMOVED: OCR-based ID verification
# We only use face matching for attendance verification


@router.post("/verify-face")
async def verify_face(
    class_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Complete attendance verification using ONLY face recognition
    No ID card scanning required!
    
    Process:
    1. Check class enrollment
    2. Liveness detection (anti-spoofing)
    3. Face verification (identity confirmation)
    4. Mark attendance
    """
    # Check enrollment
    class_obj = await db["classes"].find_one({"_id": ObjectId(class_id)})
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if str(current_user.id) not in class_obj.get("enrolled_student_ids", []):
         raise HTTPException(status_code=403, detail="Not enrolled in this class")

    content = await file.read()
    
    # Step 1: Liveness Check (ensure it's a real person, not a photo)
    liveness_score = ml_service.check_liveness(content)
    if liveness_score < 0.8: # Threshold
         raise HTTPException(
             status_code=400, 
             detail="Liveness check failed. Please use live camera, not a photo."
         )

    # Step 2: Face Verification (match face to enrolled embedding)
    result = ml_service.verify_face(content, current_user.face_embedding)
    if not result["verified"]:
         raise HTTPException(
             status_code=400, 
             detail=f"Face verification failed. Confidence: {result['confidence']:.1f}%"
         )

    # Step 3: Mark Attendance

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
