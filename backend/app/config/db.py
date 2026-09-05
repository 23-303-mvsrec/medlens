import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from .settings import settings
from .local_db import local_db_instance

class Database:
    client: AsyncIOMotorClient = None
    db = None
    use_local: bool = True

db = Database()

async def connect_to_mongo():
    try:
        # Try connecting with a strict 2000ms timeout so we don't hang if offline
        client = AsyncIOMotorClient(settings.DATABASE_URL, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        db.client = client
        db.db = client[settings.DATABASE_NAME]
        db.use_local = False
        print(f"Connected to remote MongoDB: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"Remote DB unavailable ({e}). Using local MedLens JSON database (backend/data/medlens_db.json)")
        db.use_local = True
        db.db = local_db_instance

async def close_mongo_connection():
    if db.client:
        db.client.close()
    print("Database connection closed")

def get_database():
    if db.use_local or db.db is None:
        return local_db_instance
    return db.db
