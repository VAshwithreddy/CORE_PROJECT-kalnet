from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.schemas.me import UserResponse, UserProfileResponse, UserProfileUpdate
from src.services.me import MeService
from src.core.database import get_db

router = APIRouter()

@router.get("", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)) -> UserResponse:
    """
    Retrieve basic information for the currently authenticated user.
    """
    return MeService.get_basic_info(db)

@router.get("/profile", response_model=UserProfileResponse)
def get_current_user_profile(db: Session = Depends(get_db)) -> UserProfileResponse:
    """
    Retrieve the detailed profile for the currently authenticated user.
    """
    return MeService.get_profile(db)

@router.patch("/profile", response_model=UserProfileResponse)
def update_current_user_profile(
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """
    Update the detailed profile for the currently authenticated user.
    Only fields provided in the request will be updated.
    """
    update_data = profile_update.dict(exclude_unset=True)
    return MeService.update_profile(update_data, db)
