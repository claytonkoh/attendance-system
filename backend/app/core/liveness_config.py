"""
Liveness Detection Configuration
TUNED FOR REALISTIC HUMAN BEHAVIOR (normal blink, 3 second turn)
"""
import numpy as np

# ===== FACE VERIFICATION CONFIGURATION =====
SIMILARITY_THRESHOLD = 0.40  # Match notebook (previously 0.20 in notebook but 0.40 in code?) 
# Notebook says: "SIMILARITY_THRESHOLD = 0.20" in ONE cell, but "confidence >= 0.80" later.
# We will trust the "Confidence >= 0.80" logic. 
CONFIDENCE_THRESHOLD = 0.80  # Strictest matching

# ===== LIVENESS DETECTION PARAMETERS =====
# STRICTER settings to prevent spoofing
BLINK_THRESH = 0.18  # Very strict - eyes must be fully closed
TURN_THRESH = 20     # Strict - explicit 20 degree head turn required

# CRITICAL: Frame counts for timing
# These map to frontend checks (approx 100ms per check)
HOLD_FRAMES = 15          # 1.5 seconds hold required (prevents quick photo flashes)
BLINK_MIN_FRAMES = 3      # 300ms blink duration


CHALLENGE_TIMEOUT = 10.0  # Increased for more time

# ===== CHALLENGE CONFIGURATION =====
CHALLENGES = ["LOOK LEFT", "LOOK RIGHT", "BLINK"]
REQUIRED_PASSES = 3
VERIFICATION_DELAY = 2.0

# ===== MEDIAPIPE CONFIGURATION =====
# Lenient detection settings
MEDIAPIPE_CONFIG = {
    "max_num_faces": 1,
    "refine_landmarks": True,
    "min_detection_confidence": 0.3,  # Lowered for easier detection
    "min_tracking_confidence": 0.3    # Lowered for easier detection
}

# ===== 3D FACE MODEL FOR HEAD POSE ESTIMATION =====
# These are standardized 3D coordinates for key facial landmarks
FACE_3D_MODEL = np.array([
    [0.0, 0.0, 0.0],            # Nose tip
    [0.0, -330.0, -65.0],       # Chin
    [-225.0, 170.0, -135.0],    # Left eye left corner
    [225.0, 170.0, -135.0],     # Right eye right corner
    [-150.0, -150.0, -125.0],   # Left mouth corner
    [150.0, -150.0, -125.0]     # Right mouth corner
], dtype=np.float64)

# ===== MEDIAPIPE LANDMARK INDICES =====
# Indices for facial landmarks used in calculations
FACE_2D_IDX = [1, 152, 33, 263, 61, 291]  # Landmarks for head pose estimation

# Eye landmark indices for EAR calculation
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [263, 387, 385, 362, 380, 373]

# ===== VERIFICATION SETTINGS =====
class LivenessVerificationConfig:
    """Configuration class for liveness verification settings"""
    
    # Face matching
    similarity_threshold = SIMILARITY_THRESHOLD
    confidence_threshold = CONFIDENCE_THRESHOLD
    
    # Liveness challenges
    blink_threshold = BLINK_THRESH
    turn_threshold = TURN_THRESH
    challenge_timeout = CHALLENGE_TIMEOUT
    hold_frames = HOLD_FRAMES
    blink_min_frames = BLINK_MIN_FRAMES
    
    # Challenge requirements
    challenges = CHALLENGES
    required_passes = REQUIRED_PASSES
    verification_delay = VERIFICATION_DELAY
    
    # MediaPipe
    mediapipe_config = MEDIAPIPE_CONFIG
    face_3d_model = FACE_3D_MODEL
    face_2d_idx = FACE_2D_IDX
    left_eye = LEFT_EYE
    right_eye = RIGHT_EYE
    
    @classmethod
    def get_config_dict(cls):
        """Return all configuration as a dictionary"""
        return {
            "similarity_threshold": cls.similarity_threshold,
            "confidence_threshold": cls.confidence_threshold,
            "blink_threshold": cls.blink_threshold,
            "turn_threshold": cls.turn_threshold,
            "challenge_timeout": cls.challenge_timeout,
            "hold_frames": cls.hold_frames,
            "blink_min_frames": cls.blink_min_frames,
            "challenges": cls.challenges,
            "required_passes": cls.required_passes,
        }
