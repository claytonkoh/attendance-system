"""
Liveness verification router - Challenge-based liveness detection
Implements the interactive challenge system from siamese.ipynb
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.services.ml_service import ml_service
from app.core.liveness_config import LivenessVerificationConfig as Config
from typing import Dict
import random

router = APIRouter()

@router.get("/config")
async def get_liveness_config():
    """
    Get liveness detection configuration.
    Frontend can use this to know what challenges are available and their parameters.
    """
    return Config.get_config_dict()

@router.post("/verify-challenge")
async def verify_challenge(
    challenge: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Verify a specific liveness challenge frame.
    
    Args:
        challenge: Challenge type ("BLINK", "LOOK LEFT", "LOOK RIGHT")
        file: Image frame to verify
    
    Returns:
        Verification result with metrics
    
    This endpoint is used for real-time challenge verification where the frontend
    sends frames as the user performs challenges.
    """
    if challenge not in Config.challenges:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid challenge. Must be one of: {', '.join(Config.challenges)}"
        )
    
    content = await file.read()
    
    result = ml_service.verify_liveness_challenge(content, challenge)
    
    return {
        "challenge": challenge,
        "face_detected": result["face_detected"],
        "challenge_passed": result["challenge_passed"],
        "metrics": result["metrics"]
    }

@router.post("/generate-challenge")
async def generate_challenge():
    """
    Generate a random liveness challenge.
    
    Returns:
        Dict with challenge type and timeout
    
    The frontend can call this to get the next challenge to present to the user.
    """
    challenge = random.choice(Config.challenges)
    
    return {
        "challenge": challenge,
        "timeout": Config.challenge_timeout,
        "hold_frames_required": Config.hold_frames if challenge != "BLINK" else None,
        "blink_min_frames": Config.blink_min_frames if challenge == "BLINK" else None
    }

@router.post("/verify-liveness-session")
async def verify_liveness_session(
    student_id: str = Form(...),
    verification_image: UploadFile = File(...),
):
    """
    Complete liveness verification session.
    
    This endpoint assumes the frontend has already completed the challenges
    and is now submitting the final verification image.
    
    Args:
        student_id: ID of the student
        verification_image: Final image captured after challenges
    
    Returns:
        Success status with confidence score
    
    In a full implementation, this would:
    1. Verify that challenges were recently completed (tracked in session/cache)
    2. Perform face matching against enrolled embedding
    3. Return comprehensive verification result
    """
    content = await verification_image.read()
    
    # Check liveness
    liveness_score = ml_service.check_liveness(content)
    
    if liveness_score < Config.confidence_threshold:
        raise HTTPException(
            status_code=400,
            detail=f"Liveness verification failed. Score: {liveness_score:.2f}"
        )
    
    return {
        "verified": True,
        "liveness_score": liveness_score,
        "message": "Liveness verification successful",
        "challenges_required": Config.required_passes
    }
