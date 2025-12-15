from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.db.mongodb import get_database
from app.routers.deps import get_current_admin_user
from app.models.attendance import AttendanceInDB
from app.models.user import UserResponse
from app.models.class_model import ClassResponse
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """Get dashboard statistics for admin"""
    
    # Count total users
    total_students = await db["users"].count_documents({"role": "student"})
    total_lecturers = await db["users"].count_documents({"role": "lecturer"})
    
    # Count total classes
    total_classes = await db["classes"].count_documents({})
    
    # Count total attendance records
    total_attendance = await db["attendance"].count_documents({})
    
    # Get today's attendance
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_start_str = today_start.strftime("%Y-%m-%d %H:%M:%S.%f")
    today_start_dtime = datetime.strptime(today_start_str, "%Y-%m-%d %H:%M:%S.%f")
    
    today_attendance = await db["attendance"].count_documents({
        "timestamp": {"$gte": today_start_dtime}
    })
    
    # Get recent attendance (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    week_ago_str = week_ago.strftime("%Y-%m-%d %H:%M:%S.%f")
    week_ago_dtime = datetime.strptime(week_ago_str, "%Y-%m-%d %H:%M:%S.%f")
    
    recent_attendance = await db["attendance"].count_documents({
        "timestamp": {"$gte": week_ago_dtime}
    })
    
    return {
        "totalStudents": total_students,
        "totalLecturers": total_lecturers,
        "totalUsers": total_students + total_lecturers,
        "totalClasses": total_classes,
        "totalAttendance": total_attendance,
        "todayAttendance": today_attendance,
        "weekAttendance": recent_attendance
    }

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
):
    """Get all users for admin management"""
    users = await db["users"].find().to_list(1000)
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
):
    """Get specific user details"""
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
):
    """Delete a user"""
    result = await db["users"].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.get("/classes", response_model=List[ClassResponse])
async def get_all_classes(
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
):
    """Get all classes for admin"""
    classes = await db["classes"].find().to_list(1000)
    return classes

@router.get("/attendance")
async def get_all_attendance(
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
):
    """Get all attendance records with user and class details"""
    attendance_records = await db["attendance"].find().sort("timestamp", -1).to_list(1000)
    
    # Enrich attendance records with user and class information
    enriched_records = []
    for record in attendance_records:
        # Get user info
        user = await db["users"].find_one({"_id": ObjectId(record["student_id"])})
        # Get class info
        class_info = await db["classes"].find_one({"_id": ObjectId(record["class_id"])})
        
        enriched_records.append({
            "_id": str(record["_id"]),
            "timestamp": record.get("timestamp"),
            "status": record.get("status", "present"),
            "verification_method": record.get("verification_method", "unknown"),
            "confidence_score": record.get("confidence_score", 0),
            "liveness_score": record.get("liveness_score", 0),
            "user": {
                "_id": str(user["_id"]) if user else None,
                "name": user.get("name") if user else "Unknown",
                "email": user.get("email") if user else "Unknown",
                "student_id": user.get("student_id") if user else None
            } if user else None,
            "class": {
                "_id": str(class_info["_id"]) if class_info else None,
                "name": class_info.get("name") if class_info else "Unknown",
                "code": class_info.get("code") if class_info else "Unknown"
            } if class_info else None
        })
    
    return enriched_records

@router.get("/attendance/class/{class_id}")
async def get_class_attendance(
    class_id: str,
    db = Depends(get_database), 
    current_user = Depends(get_current_admin_user)
):
    """Get attendance records for a specific class"""
    attendance_records = await db["attendance"].find({
        "class_id": class_id
    }).sort("timestamp", -1).to_list(1000)
    
    # Enrich with user information
    enriched_records = []
    for record in attendance_records:
        user = await db["users"].find_one({"_id": ObjectId(record["student_id"])})
        enriched_records.append({
            "_id": str(record["_id"]),
            "timestamp": record.get("timestamp"),
            "status": record.get("status", "present"),
            "verification_method": record.get("verification_method", "unknown"),
            "confidence_score": record.get("confidence_score", 0),
            "liveness_score": record.get("liveness_score", 0),
            "user": {
                "_id": str(user["_id"]) if user else None,
                "name": user.get("name") if user else "Unknown",
                "email": user.get("email") if user else "Unknown",
                "student_id": user.get("student_id") if user else None
            } if user else None
        })
    
    return enriched_records
