from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.core.database import get_rls_db_for
from src.core.dependencies import CurrentUser, get_current_user
from src.schemas.requests import WorkRequestCreate, WorkRequestResponse, WorkRequestUpdate
from src.services.requests import RequestsService

router = APIRouter()


@router.get("", response_model=List[WorkRequestResponse])
def list_requests(db: Session = Depends(get_rls_db_for(get_current_user)), current_user: CurrentUser = Depends(get_current_user)):
    return RequestsService.list_visible(db, current_user)


@router.post("", response_model=WorkRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(data: WorkRequestCreate, db: Session = Depends(get_rls_db_for(get_current_user)), current_user: CurrentUser = Depends(get_current_user)):
    return RequestsService.create(db, current_user, data)


@router.patch("/{request_id}", response_model=WorkRequestResponse)
def update_request(request_id: UUID, data: WorkRequestUpdate, db: Session = Depends(get_rls_db_for(get_current_user)), current_user: CurrentUser = Depends(get_current_user)):
    return RequestsService.update(db, current_user, request_id, data)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_request(request_id: UUID, db: Session = Depends(get_rls_db_for(get_current_user)), current_user: CurrentUser = Depends(get_current_user)):
    """Withdraw the caller's own unprocessed request."""
    RequestsService.withdraw(db, current_user, request_id)
