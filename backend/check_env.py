import os
from dotenv import load_dotenv

load_dotenv()
print(f"MONGODB_URL from dotenv: {os.getenv('MONGODB_URL')}")

from app.core.config import settings
print(f"MONGODB_URL from settings: {settings.MONGODB_URL}")
