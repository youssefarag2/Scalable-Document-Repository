from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db_dep, get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.documents import DocumentSummary

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me/documents", response_model=List[DocumentSummary])
def my_documents(
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> List[DocumentSummary]:
    docs = db.query(Document).filter(Document.owner_id == current_user.id).order_by(Document.updated_at.desc()).all()
    return [
        DocumentSummary(
            id=d.id,
            title=d.title,
            current_version_number=d.current_version_number,
            tags=[t.name for t in d.tags],
            updated_at=d.updated_at.isoformat() if d.updated_at else None,
        )
        for d in docs
    ]