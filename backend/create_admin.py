"""
Script to create an admin user for the attendance system
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    # Get MongoDB connection
    mongodb_url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(mongodb_url)
    db = client["attendance_db"]
    users_collection = db["users"]
    
    # Admin credentials
    admin_email = "admin@attendance.com"
    admin_password = "admin123"
    admin_name = "System Administrator"
    
    # Check if admin already exists
    existing_admin = await users_collection.find_one({"email": admin_email})
    
    if existing_admin:
        print(f"❌ Admin user already exists with email: {admin_email}")
        print(f"   To reset password, please delete the user from MongoDB first.")
        return
    
    # Hash the password
    hashed_password = pwd_context.hash(admin_password)
    
    # Create admin user document
    admin_user = {
        "name": admin_name,
        "email": admin_email,
        "hashed_password": hashed_password,
        "role": "admin",
        "student_id": None,
        "major": None,
        "face_embedding": None
    }
    
    # Insert admin user
    result = await users_collection.insert_one(admin_user)
    
    print("=" * 60)
    print("✅ ADMIN USER CREATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"📧 Email:    {admin_email}")
    print(f"🔑 Password: {admin_password}")
    print(f"👤 Role:     admin")
    print(f"🆔 User ID:  {result.inserted_id}")
    print("=" * 60)
    print("\n⚠️  IMPORTANT: Please change this password after first login!")
    print(f"   You can now login at: http://localhost:5174\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
