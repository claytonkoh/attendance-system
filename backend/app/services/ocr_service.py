class OCRService:
    def extract_text(self, image_bytes: bytes) -> str:
        """
        Extracts text from ID card image.
        """
        # MOCK IMPLEMENTATION
        # In real world, use Tesseract or Google Cloud Vision API
        return "STUDENT_ID: 12345678"

    def verify_id_card(self, image_bytes: bytes, student_id: str) -> bool:
        text = self.extract_text(image_bytes)
        return student_id in text

ocr_service = OCRService()
