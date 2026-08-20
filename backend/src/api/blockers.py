from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_rls_db_for
from src.core.dependencies import CurrentUser, get_current_user
from src.schemas.blockers import BlockerResolveRequest, BlockerResponse
from src.services.blockers import BlockersService

router = APIRouter()


@router.get("", response_model=List[BlockerResponse])
def list_blockers(db: Session = Depends(get_rls_db_for(get_current_user)), current_user: CurrentUser = Depends(get_current_user)):
    return BlockersService.list_visible(db, current_user)


@router.post("/{assignment_id}/resolve", status_code=204)
def resolve_blocker(assignment_id: UUID, data: BlockerResolveRequest, db: Session = Depends(get_rls_db_for(get_current_user)), current_user: CurrentUser = Depends(get_current_user)):
    BlockersService.resolve(db, current_user, assignment_id, data.note)
