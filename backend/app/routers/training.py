from fastapi import APIRouter, HTTPException
from app.services.training_service import training_service

router = APIRouter(
    tags=["Model Training"],
    responses={404: {"description": "Not found"}},
)

@router.get("/fine-tune")
@router.post("/fine-tune")
async def fine_tune_model():
    """
    Triggers the Fine-Tuning / Training process for the custom Face Verification Model.
    
    This process:
    1.  Fetches all student enrollment embeddings (Positive & Negative pairs).
    2.  Trains a custom Neural Network (Dense Layer) on top of FaceNet embeddings.
    3.  Evaluates performance on a test set.
    
    Returns:
        JSON report containing Accuracy, F1 Score, Confusion Matrix, and Training History.
    """
    try:
        results = await training_service.train_and_evaluate()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
