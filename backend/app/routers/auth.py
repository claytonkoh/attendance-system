from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
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
    file: UploadFile = File(...),
    db = Depends(get_database)
):
    try:
        print(f"Registering user: {email}")
        # Check if user exists
        if await db["users"].find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")

        # Save profile image
        print("Saving file...")
        file_path = await save_upload_file(file)
        print(f"File saved at {file_path}")
        
        # Get face embedding
        # In real app, read file bytes
        print("Getting face embedding...")
        file.file.seek(0)
        content = await file.read()
        embedding = ml_service.get_face_embedding(content)

        user_dict = {
            "name": name,
            "email": email,
            "hashed_password": get_password_hash(password),
            "student_id": student_id,
            "major": major,
            "role": "student",
            "profile_image_url": file_path,
            "face_embedding": embedding
        }
        
        print("Inserting into DB...")
        new_user = await db["users"].insert_one(user_dict)
        print(f"User inserted with ID: {new_user.inserted_id}")
        
        created_user = await db["users"].find_one({"_id": new_user.inserted_id})
        print(f"Retrieved user: {created_user}")
        print("User registered successfully")
        
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
