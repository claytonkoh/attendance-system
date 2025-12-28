from fastapi import APIRouter, HTTPException
from app.services.training_service import training_service

router = APIRouter(
    tags=["Model Training"],
    responses={404: {"description": "Not found"}},
)

@router.get("/fine-tune")
@router.post("/fine-tune")
async def fine_tune_model():
    try:
        results = await training_service.train_and_evaluate()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
