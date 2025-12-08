from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.mongodb import get_database
from app.models.user import UserCreate, UserResponse, UserInDB
from app.services.ml_service import ml_service
from app.utils.file_upload import save_upload_file
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    student_id: str = Form(...),
    major: str = Form(...),
    files: List[UploadFile] = File(...),  # Changed to accept multiple files (5 samples)
    db = Depends(get_database)
):
    """
    Register a new user with 5-sample enrollment (matching siamese.ipynb logic)
    
    Process:
    1. Capture 5 face samples from the user
    2. Generate embedding for each sample using DeepFace/Facenet
    3. Average the 5 embeddings to create the final enrollment embedding
    4. Store both individual embeddings and averaged embedding
    """
    try:
        print(f"Registering user: {email}")
        
        # Validate that exactly 5 samples were provided
        if len(files) != 5:
            raise HTTPException(
                status_code=400, 
                detail=f"Exactly 5 face samples required for enrollment. Received {len(files)} samples."
            )
        
        # Check if user exists
        if await db["users"].find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")

        # Save the first profile image (or you could create a composite)
        print("Saving first file as profile image...")
        file_path = await save_upload_file(files[0])
        print(f"Profile image saved at {file_path}")
        
        # Process all 5 enrollment samples
        print("Processing 5 enrollment samples...")
        image_bytes_list = []
        for i, file in enumerate(files):
            file.file.seek(0)
            content = await file.read()
            image_bytes_list.append(content)
            print(f"✅ Sample {i+1}/5 processed")
        
        # Get embeddings using ML service (mimics siamese.ipynb enrollment)
        print("Generating embeddings from samples...")
        enrollment_result = ml_service.process_enrollment_samples(image_bytes_list)
        
        individual_embeddings = enrollment_result["individual_embeddings"]
        averaged_embedding = enrollment_result["averaged_embedding"]
        
        print(f"✨ Enrollment complete: {enrollment_result['sample_count']} samples averaged")

        user_dict = {
            "name": name,
            "email": email,
            "hashed_password": get_password_hash(password),
            "student_id": student_id,
            "major": major,
            "role": "student",
            "profile_image_url": file_path,
            "face_embedding": averaged_embedding,  # The averaged embedding for verification
            "enrollment_embeddings": individual_embeddings  # Store all 5 individual embeddings
        }
        
        print("Inserting into DB...")
        new_user = await db["users"].insert_one(user_dict)
        print(f"User inserted with ID: {new_user.inserted_id}")
        
        created_user = await db["users"].find_one({"_id": new_user.inserted_id})
        print(f"✅ Student {student_id} successfully enrolled with 5 samples")
        
        # Return simplified response
        return {
            "_id": str(created_user["_id"]),
            "name": created_user["name"],
            "email": created_user["email"],
            "student_id": created_user.get("student_id"),
            "major": created_user.get("major"),
            "role": created_user["role"]
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import datetime
        error_msg = f"\n\n{'='*50}\n{datetime.datetime.now()}\n{traceback.format_exc()}\n{'='*50}\n"
        with open("registration_error.log", "a") as f:
            f.write(error_msg)
        print(error_msg)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_database)):
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from app.routers.deps import get_current_active_user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_active_user)):
    return current_user
