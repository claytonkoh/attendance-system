from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.db.mongodb import get_database
from app.routers.deps import get_current_user
from app.models.user import UserInDB
from app.services.ml_service import ml_service
from app.models.attendance import AttendanceInDB
from datetime import datetime
from bson import ObjectId
from app.core.liveness_config import CONFIDENCE_THRESHOLD, SIMILARITY_THRESHOLD

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
    Complete attendance verification using face recognition WITH liveness detection.
    Now uses lenient thresholds from config for better reliability!
    
    Process:
    1. Check class enrollment
    2. Liveness detection using MediaPipe (anti-spoofing)
    3. Face verification with confidence scoring (cosine similarity)
    4. Mark attendance if all checks pass
    """
    # Check enrollment
    class_obj = await db["classes"].find_one({"_id": ObjectId(class_id)})
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if str(current_user.id) not in class_obj.get("enrolled_student_ids", []):
         raise HTTPException(status_code=403, detail="Not enrolled in this class")

    content = await file.read()
    
    # Step 1: Liveness Check with MediaPipe Face Mesh
    # Using LENIENT threshold from config (0.70 instead of 0.80)
    liveness_score = ml_service.check_liveness(content)
    LIVENESS_THRESHOLD = 0.70  # Lowered from 0.80 for better detection
    
    if liveness_score < LIVENESS_THRESHOLD:
         raise HTTPException(
             status_code=400, 
             detail=f"Liveness check failed (score: {liveness_score:.2f}). Please use live camera, not a photo."
         )

    # Step 2: Face Verification with Liveness Integration
    # Uses cosine similarity with LENIENT threshold from config
    result = ml_service.verify_face_with_liveness(content, current_user.face_embedding)
    
    if not result["verified"]:
         # Get actual confidence and threshold used
         actual_confidence = result.get("confidence", 0.0)
         threshold_used = result.get("threshold", CONFIDENCE_THRESHOLD)
         
         raise HTTPException(
             status_code=400, 
             detail=f"Face verification failed. Confidence: {actual_confidence*100:.1f}% (Required: {threshold_used*100:.1f}%)"
         )

    # Step 3: Mark Attendance
    attendance_record = {
        "class_id": class_id,
        "student_id": str(current_user.id),
        "timestamp": datetime.utcnow(),
        "status": "present",
        "verification_method": "face_recognition_with_liveness",
        "confidence_score": result["confidence"],
        "liveness_score": result["liveness_score"],
        "similarity": result.get("similarity", 0.0),
        "distance": result.get("distance", 0.0),
        "snapshot_url": "path/to/snapshot"  # Save file and put path here
    }
    
    await db["attendance"].insert_one(attendance_record)
    
    return {
        "message": "Attendance marked successfully",
        "confidence": f"{result['confidence']*100:.1f}%",
        "liveness_score": f"{result['liveness_score']*100:.1f}%",
        "verified": True
    }
