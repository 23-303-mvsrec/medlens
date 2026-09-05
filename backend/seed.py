import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.password import hash_password
from app.config.settings import settings
import datetime

async def seed_admin():
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client[settings.DATABASE_NAME]
    
    # Check if admin exists
    admin_email = "admin@apexcare.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        admin_user = {
            "name": "Admin Apex",
            "email": admin_email,
            "password": hash_password("admin123"),
            "role": "admin",
            "created_at": datetime.datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        print(f"Admin user created: {admin_email}")
    else:
        print(f"Admin user already exists: {admin_email}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())
