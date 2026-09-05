from fastapi import APIRouter, Depends, status
from ..schemas.user_schema import UserCreate, UserLogin, UserResponse, TokenResponse
from ..services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    return await auth_service.register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    return await auth_service.authenticate_user(login_data)
