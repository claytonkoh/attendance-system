import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def test_mongodb():
    connection_string = os.getenv("MONGODB_URL")
    print(f"Testing connection to: {connection_string.split('@')[-1]}")
    
    try:
        # Create client with timeout settings
        client = AsyncIOMotorClient(connection_string, serverSelectionTimeoutMS=5000)
        
        # Test connection with ping
        print("Pinging MongoDB...")
        result = await client.admin.command('ping')
        print(f"✓ Ping successful: {result}")
        
        # List databases
        print("\nListing databases...")
        databases = await client.list_database_names()
        print(f"✓ Found {len(databases)} databases: {databases}")
        
        # Try to access attendance_db
        db = client["attendance_db"]
        print(f"\nAccessing 'attendance_db'...")
        
        # Try to list collections
        collections = await db.list_collection_names()
        print(f"✓ Collections in attendance_db: {collections if collections else 'No collections yet'}")
        
        # Try to insert a test document
        print("\nTrying to insert test document...")
        test_collection = db["test"]
        result = await test_collection.insert_one({"test": "data", "timestamp": "2025-12-03"})
        print(f"✓ Insert successful! ID: {result.inserted_id}")
        
        # Clean up test document
        await test_collection.delete_one({"_id": result.inserted_id})
        print("✓ Test document cleaned up")
        
        print("\n✅ ALL TESTS PASSED - MongoDB is fully connected and operational!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mongodb())
