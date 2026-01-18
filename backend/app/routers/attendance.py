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
    

    liveness_score = ml_service.check_liveness(content)
    LIVENESS_THRESHOLD = 0.70  
    
    if liveness_score < LIVENESS_THRESHOLD:
         raise HTTPException(
             status_code=400, 
             detail=f"Liveness check failed (score: {liveness_score:.2f}). Please use live camera, not a photo."
         )

    # Step 2: Face Verification with Liveness Integration
    if current_user.enrollment_embeddings and len(current_user.enrollment_embeddings) == 5:
        # Use multi-sample verification
        result = ml_service.verify_face_multi(
            content, 
            current_user.enrollment_embeddings,
            current_user.face_embedding
        )
        # Add liveness score 
        result["liveness_score"] = liveness_score
    else:
        # Fallback
        result = ml_service.verify_face_with_liveness(content, current_user.face_embedding)
    
    if not result["verified"]:
         actual_confidence = result.get("confidence", 0.0)
         threshold_used = result.get("threshold", CONFIDENCE_THRESHOLD)
         
         detail_msg = f"Face verification failed. Confidence: {actual_confidence*100:.1f}% (Required: {threshold_used*100:.1f}%)"
         
         if result.get("match_count") is not None:
             detail_msg += f". Matched {result.get('match_count')}/{result.get('total_samples', 5)} samples."
             
         raise HTTPException(
             status_code=400, 
             detail=detail_msg
         )

    # Step 3: Mark Attendance
    attendance_record = {
        "class_id": class_id,
        "student_id": str(current_user.id),
        "timestamp": datetime.now(),
        "status": "present",
        "verification_method": "face_recognition_with_liveness",
        "confidence_score": result["confidence"],
        "liveness_score": result["liveness_score"],
        "similarity": result.get("similarity", 0.0),
        "distance": result.get("distance", 0.0),
        "snapshot_url": "path/to/snapshot" 
    }
    
    await db["attendance"].insert_one(attendance_record)
    
    return {
        "message": "Attendance marked successfully",
        "confidence": f"{result['confidence']*100:.1f}%",
        "liveness_score": f"{result['liveness_score']*100:.1f}%",
        "verified": True
    }
