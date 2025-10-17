from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.api.deps import get_db_dep, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentVersion, Tag, DocumentPermission
from app.schemas.documents import DocumentCreateForm, DocumentSummary, DocumentDetail, DocumentVersionInfo
from app.services.documents import parse_csv, create_document_with_v1, user_can_view_document, get_document_or_404, get_versions_for_document


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


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document_detail(
    document_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> DocumentDetail:
    doc = get_document_or_404(db, document_id)
    # Owner can always view; otherwise check department permission
    if doc.owner_id != current_user.id and not user_can_view_document(db, document_id, current_user.department_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this document")

    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        current_version_number=doc.current_version_number,
        tags=[t.name for t in doc.tags],
        owner_id=doc.owner_id,
    )


@router.get("/{document_id}/versions", response_model=List[DocumentVersionInfo])
def get_document_versions(
    document_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> List[DocumentVersionInfo]:
    doc = get_document_or_404(db, document_id)
    if doc.owner_id != current_user.id and not user_can_view_document(db, document_id, current_user.department_id):
        raise HTTPException(status_code=403, detail="Not authorized to view versions")

    versions = get_versions_for_document(db, document_id)
    return [
        DocumentVersionInfo(
            id=v.id,
            version_number=v.version_number,
            uploaded_by_name=v.uploaded_by_name,
            uploaded_at=v.uploaded_at.isoformat() if v.uploaded_at else None,
            file_size=v.file_size,
            mime_type=v.mime_type,
        )
        for v in versions
    ]