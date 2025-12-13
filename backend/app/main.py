from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.routers import auth, classes, attendance, admin, liveness, training


app = FastAPI(title=settings.PROJECT_NAME)

# CORS
import os

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000", # React/Next.js default
    "http://localhost:5173", # Vite default
    "http://localhost:5174", # Admin Dashboard
]

# Add allowed origins from environment variable
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend(origin.strip() for origin in env_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Events
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(classes.router, prefix="/classes", tags=["classes"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(liveness.router, prefix="/liveness", tags=["liveness"])
app.include_router(training.router, prefix="/training", tags=["training"])

@app.get("/")
async def root():
    return {"message": "Welcome to Attendance System API"}
