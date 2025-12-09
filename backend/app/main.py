from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.routers import auth, classes, attendance, admin, liveness

app = FastAPI(title=settings.PROJECT_NAME)

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000", # React/Next.js default
    "http://localhost:5173", # Vite default
    "http://localhost:5174", # Admin Dashboard
]

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

@app.get("/")
async def root():
    return {"message": "Welcome to Attendance System API"}
