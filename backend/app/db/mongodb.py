from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def get_database():
    return db.client[settings.DATABASE_NAME]

async def connect_to_mongo():
    try:
        print(f"Connecting to MongoDB at: {settings.MONGODB_URL.split('@')[-1] if '@' in settings.MONGODB_URL else settings.MONGODB_URL}")
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verify the connection by pinging the database
        await db.client.admin.command('ping')
        print("✓ Connected to MongoDB successfully!")
        
        # List databases to verify permissions
        db_list = await db.client.list_database_names()
        print(f"✓ Available databases: {len(db_list)}")
        
    except Exception as e:
        print(f"✗ Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")

