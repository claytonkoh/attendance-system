import requests
from app.core.config import settings
from typing import List, Dict

class MLService:
    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL

    def get_face_embedding(self, image_bytes: bytes) -> List[float]:
        """
        Sends image to ML service to get face embedding.
        """
        # In a real scenario, you'd send the file
        # files = {'file': image_bytes}
        # response = requests.post(f"{self.base_url}/face-embedding", files=files)
        # return response.json()['embedding']
        
        # MOCK IMPLEMENTATION
        import random
        return [random.random() for _ in range(128)]

    def verify_face(self, image_bytes: bytes, stored_embedding: List[float]) -> Dict:
        """
        Sends image and stored embedding to ML service for verification.
        Returns dict with 'verified': bool, 'confidence': float, 'liveness': float
        """
        # response = requests.post(f"{self.base_url}/verify-face", ...)
        
        # MOCK IMPLEMENTATION
        return {
            "verified": True,
            "confidence": 0.98,
            "liveness": 0.99
        }

    def check_liveness(self, image_bytes: bytes) -> float:
        """
        Checks if the face in the image is real (liveness detection).
        """
        # MOCK
        return 0.99

ml_service = MLService()
