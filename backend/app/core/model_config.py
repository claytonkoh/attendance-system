"""
Model Configuration for Face Recognition System
Simplified and tuned for reliable liveness detection
"""

# ===== FACE RECOGNITION =====
class FaceRecognitionConfig:
    """DeepFace face recognition settings"""
    
    MODEL_NAME = "Facenet"  # Options: Facenet, ArcFace, VGG-Face
    DETECTOR_BACKEND = "opencv"  # opencv is fastest and most reliable
    ENFORCE_DETECTION = True
    
    # Thresholds (adjust these for accuracy)
    CONFIDENCE_THRESHOLD = 0.75  
    SIMILARITY_THRESHOLD = 0.75  


# ===== ENROLLMENT =====
class EnrollmentConfig:
    """Multi-sample enrollment settings"""
    
    REQUIRED_SAMPLES = 5
    AVERAGING_METHOD = "mean"


# ===== LIVENESS DETECTION =====
class LivenessConfig:
    """MediaPipe liveness detection - TUNED FOR RELIABILITY"""
    
    # MediaPipe Face Mesh Settings
    MAX_NUM_FACES = 1
    REFINE_LANDMARKS = True
    MIN_DETECTION_CONFIDENCE = 0.3  
    MIN_TRACKING_CONFIDENCE = 0.3   
    
    # Blink Detection (Eye Aspect Ratio)
    BLINK_THRESH = 0.25  
    BLINK_MIN_FRAMES = 3  
    
    # Head Turn Detection  
    TURN_THRESH = 15  
    HOLD_FRAMES = 30  
    
    # Challenges
    CHALLENGES = ["LOOK LEFT", "LOOK RIGHT", "BLINK"]
    REQUIRED_PASSES = 3
    CHALLENGE_TIMEOUT = 10.0  
    
    # Liveness Score
    LIVENESS_SCORE_THRESHOLD = 0.70  


# Default values for easy access
CONFIDENCE_THRESHOLD = FaceRecognitionConfig.CONFIDENCE_THRESHOLD
SIMILARITY_THRESHOLD = FaceRecognitionConfig.SIMILARITY_THRESHOLD
REQUIRED_SAMPLES = EnrollmentConfig.REQUIRED_SAMPLES
