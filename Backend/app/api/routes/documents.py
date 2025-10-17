from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.api.deps import get_db_dep, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentVersion, Tag, DocumentPermission
from app.schemas.documents import DocumentCreateForm, DocumentSummary
from app.services.documents import parse_csv, create_document_with_v1

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentSummary, status_code=status.HTTP_201_CREATED)
def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # CSV
    permission_department_ids: Optional[str] = Form(None),  # CSV of ints
    file: UploadFile = File(...),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> DocumentSummary:
    try:
        tag_names = parse_csv(tags)
        dep_ids = [int(x) for x in parse_csv(permission_department_ids)]
    except ValueError:
        raise HTTPException(status_code=400, detail="permission_department_ids must be comma-separated integers")

    doc, v1, tag_models = create_document_with_v1(
        db=db,
        current_user=current_user,
        title=title,
        description=description,
        tag_names=tag_names,
        permitted_department_ids=dep_ids,
        upload_file=file,
    )

    return DocumentSummary(
        id=doc.id,
        title=doc.title,
        current_version_number=doc.current_version_number,
        tags=[t.name for t in tag_models],
        updated_at=doc.updated_at.isoformat() if doc.updated_at else None,
    )


@router.get("", response_model=List[DocumentSummary])
def list_accessible_documents(
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> List[DocumentSummary]:
    """
    Returns only latest versions of documents the user's department can view.
    """
    if not current_user.department_id:
        return []

    # filter by permissions
    q = (
        db.query(Document)
        .join(DocumentPermission, DocumentPermission.document_id == Document.id)
        .filter(
            DocumentPermission.department_id == current_user.department_id,
            DocumentPermission.can_view == 1,
        )
    )

    docs = q.all()
    results: List[DocumentSummary] = []
    for d in docs:
        results.append(
            DocumentSummary(
                id=d.id,
                title=d.title,
                current_version_number=d.current_version_number,
                tags=[t.name for t in d.tags],
                updated_at=d.updated_at.isoformat() if d.updated_at else None,
            )
        )
    return results