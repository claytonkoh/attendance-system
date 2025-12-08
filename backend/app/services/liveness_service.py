"""
Liveness Detection Service
SIMPLIFIED - Instant detection (no frame counting required)
"""
import cv2
import numpy as np
import mediapipe as mp
from app.core.liveness_config import (
    BLINK_THRESH, TURN_THRESH,
    CONFIDENCE_THRESHOLD, MEDIAPIPE_CONFIG
)

class LivenessDetectionService:
    def __init__(self):
        # MediaPipe Face Mesh setup
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=MEDIAPIPE_CONFIG["max_num_faces"],
            refine_landmarks=MEDIAPIPE_CONFIG["refine_landmarks"],
            min_detection_confidence=MEDIAPIPE_CONFIG["min_detection_confidence"],
            min_tracking_confidence=MEDIAPIPE_CONFIG["min_tracking_confidence"]
        )
        
        # 3D face model for head pose
        self.face_3d = np.array([
            [0.0, 0.0, 0.0],
            [0.0, -330.0, -65.0],
            [-225.0, 170.0, -135.0],
            [225.0, 170.0, -135.0],
            [-150.0, -150.0, -125.0],
            [150.0, -150.0, -125.0]
        ], dtype=np.float64)
        
        # Landmark indices
        self.FACE_2D_IDX = [1, 152, 33, 263, 61, 291]
        self.LEFT_EYE = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE = [263, 387, 385, 362, 380, 373]
    
    def calculate_ear(self, landmarks, w, h, idxs):
        """Calculate Eye Aspect Ratio"""
        pts = np.array([(landmarks[i].x * w, landmarks[i].y * h) for i in idxs])
        v1 = np.linalg.norm(pts[1] - pts[5])
        v2 = np.linalg.norm(pts[2] - pts[4])
        h1 = np.linalg.norm(pts[0] - pts[3])
        if h1 == 0:
            return 0
        return (v1 + v2) / (2.0 * h1)
    
    def get_head_pose(self, landmarks, img_w, img_h):
        """Get head pose (pitch, yaw, roll)"""
        face_2d = []
        for idx in self.FACE_2D_IDX:
            lm = landmarks[idx]
            face_2d.append([lm.x * img_w, lm.y * img_h])
        
        face_2d = np.array(face_2d, dtype=np.float64)
        focal_length = 1 * img_w
        cam_matrix = np.array([
            [focal_length, 0, img_h / 2],
            [0, focal_length, img_w / 2],
            [0, 0, 1]
        ])
        dist_matrix = np.zeros((4, 1), dtype=np.float64)
        
        success, rot_vec, trans_vec = cv2.solvePnP(
            self.face_3d, face_2d, cam_matrix, dist_matrix
        )
        rmat, jac = cv2.Rodrigues(rot_vec)
        angles, mtxR, mtxQ, Qx, Qy, Qz = cv2.RQDecomp3x3(rmat)
        
        return angles[0], angles[1], angles[2]
    
    def detect_face_landmarks(self, image_bytes: bytes):
        """Detect face landmarks"""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return None
            
            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb)
            
            if results.multi_face_landmarks:
                return results.multi_face_landmarks[0].landmark, w, h
            
            return None
        except Exception as e:
            print(f"Error detecting landmarks: {str(e)}")
            return None
    
    def verify_liveness_frame(self, image_bytes: bytes, challenge: str):
        """
        Verify liveness frame - INSTANT detection
        Just checks if the condition is met in THIS single frame
        """
        detection = self.detect_face_landmarks(image_bytes)
        if not detection:
            return {
                "challenge_passed": False,
                "face_detected": False,
                "metrics": None 
            }
        
        landmarks, w, h = detection
        
        # Get metrics
        pitch, yaw, roll = self.get_head_pose(landmarks, w, h)
        left_ear = self.calculate_ear(landmarks, w, h, self.LEFT_EYE)
        right_ear = self.calculate_ear(landmarks, w, h, self.RIGHT_EYE)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # INSTANT CHECK - no counting, just check THIS frame
        passed = False
        
        if challenge == "LOOK LEFT":
            # Must turn LEFT significantly (yaw < -thresh)
            # AND maintain upright head position (roll/pitch small) to prevent photo rotation attacks
            is_turning = yaw < -TURN_THRESH
            
            # NORMALIZATION: Handle cases where pitch/roll is near 180 (inverted/flipped coordinates)
            # Accept if angle is within tolerance of 0 OR within tolerance of 180/-180
            valid_pitch = abs(pitch) < 45 or abs(abs(pitch) - 180) < 45
            valid_roll = abs(roll) < 40 or abs(abs(roll) - 180) < 40
            
            is_upright = valid_pitch and valid_roll
            passed = bool(is_turning and is_upright)
            
            print(f"LOOK LEFT: yaw={yaw:.2f} (<-{TURN_THRESH}?), roll={roll:.2f}, pitch={pitch:.2f}, passed={passed}")
        
        elif challenge == "LOOK RIGHT":
            # Must turn RIGHT significantly (yaw > thresh)
            is_turning = yaw > TURN_THRESH
            
            valid_pitch = abs(pitch) < 45 or abs(abs(pitch) - 180) < 45
            valid_roll = abs(roll) < 40 or abs(abs(roll) - 180) < 40
            
            is_upright = valid_pitch and valid_roll
            passed = bool(is_turning and is_upright)
            
            print(f"LOOK RIGHT: yaw={yaw:.2f} (>{TURN_THRESH}?), roll={roll:.2f}, pitch={pitch:.2f}, passed={passed}")
        
        elif challenge == "BLINK":
            passed = bool(avg_ear < BLINK_THRESH)  # Are eyes closed NOW?
            print(f"BLINK: EAR={avg_ear:.3f}, threshold={BLINK_THRESH}, passed={passed}")
        
        return {
            "challenge_passed": passed,
            "face_detected": True,
            "metrics": {
                "pitch": float(pitch),
                "yaw": float(yaw),
                "roll": float(roll),
                "ear": float(avg_ear),
                "is_blinking": bool(avg_ear < BLINK_THRESH)
            }
        }
    
    def calculate_face_similarity(self, embedding1: list, embedding2: list):
        """Calculate cosine similarity"""
        a = np.array(embedding1)
        b = np.array(embedding2)
        
        similarity = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        dist = 1 - similarity
        confidence = similarity
        verified = bool(confidence >= CONFIDENCE_THRESHOLD)
        
        return {
            "verified": verified,
            "confidence": float(confidence),
            "similarity": float(similarity),
            "distance": float(dist),
            "threshold": CONFIDENCE_THRESHOLD
        }

# Global instance
liveness_service = LivenessDetectionService()
