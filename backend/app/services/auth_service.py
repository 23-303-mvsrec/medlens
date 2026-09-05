from fastapi import HTTPException, status
from ..models.user_model import UserDB
from ..schemas.user_schema import UserCreate, UserLogin, UserResponse, TokenResponse
from ..utils.password import hash_password, verify_password
from ..utils.jwt_handler import create_access_token
from ..config.db import get_database
from bson import ObjectId
from datetime import datetime

class AuthService:
    async def register_user(self, user_data: UserCreate):
        db = get_database()
        
        # Check if email already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and save user
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_data.password)
        user_dict["created_at"] = datetime.utcnow()
        
        new_user = await db.users.insert_one(user_dict)
        
        return UserResponse(
            id=str(new_user.inserted_id),
            **user_data.model_dump(exclude={"password"}) ,
            created_at=user_dict["created_at"]
        )

    async def authenticate_user(self, login_data: UserLogin):
        db = get_database()
        
        user = await db.users.find_one({"email": login_data.email})
        if not user or not verify_password(login_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(
            data={"sub": str(user["_id"]), "role": user["role"]}
        )
        
        user_response = UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user["role"],
            doctor_id=user.get("doctor_id"),
            created_at=user["created_at"]
        )
        
        return TokenResponse(
            access_token=access_token,
            role=user["role"],
            user=user_response
        )

auth_service = AuthService()
