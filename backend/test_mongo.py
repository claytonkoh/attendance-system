import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    try:
        # Using the connection string directly from your .env
        connection_string = "mongodb+srv://claytonkoh:claytonkoh7@cluster0.exvhydh.mongodb.net"
        print(f"Attempting to connect to: {connection_string}")
        
        client = AsyncIOMotorClient(connection_string)
        
        # The is_master command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("SUCCESS: Connected to MongoDB!")
        
        # Try to list database names to verify permissions
        dbs = await client.list_database_names()
        print(f"Databases found: {dbs}")
        
    except Exception as e:
        print(f"ERROR: Could not connect to MongoDB.")
        print(f"Details: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
