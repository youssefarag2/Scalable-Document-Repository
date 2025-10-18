from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.api.deps import get_db_dep, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentVersion, Tag, DocumentPermission
from fastapi.responses import FileResponse
from app.schemas.documents import (
    DocumentCreateForm,
    DocumentSummary,
    DocumentDetail,
    DocumentVersionInfo,
    DocumentUpdateRequest,
)

from app.services.documents import (
    parse_csv,
    create_document_with_v1,
    user_can_view_document,
    user_can_download_document,
    get_document_or_404,
    get_versions_for_document,
    resolve_version,
    can_upload_new_version,
    add_new_version,
    replace_document_metadata,
)

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


@router.get("/search", response_model=List[DocumentSummary])
def search_documents(
    title: Optional[str] = Query(default=None),
    tags: Optional[str] = Query(default=None, description="CSV, e.g. Finance,Legal"),
    description: Optional[str] = Query(default=None),
    version: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> List[DocumentSummary]:
    """
    Simple search: title/description ILIKE; tags are OR'ed; returns latest versions only, filtered by view permission.
    """
    if not current_user.department_id:
        return []

    q = (
        db.query(Document)
        .join(DocumentPermission, DocumentPermission.document_id == Document.id)
        .filter(
            DocumentPermission.department_id == current_user.department_id,
            DocumentPermission.can_view == 1,
        )
    )

    if title:
        q = q.filter(Document.title.ilike(f"%{title}%"))
    if description:
        q = q.filter(Document.description.ilike(f"%{description}%"))
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            q = q.join(Document.tags).filter(Tag.name.in_(tag_list))

    # version filter: show docs whose current_version_number matches
    if version:
        q = q.filter(Document.current_version_number == version)

    docs = q.order_by(Document.updated_at.desc()).all()
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




@router.get("/{document_id}", response_model=DocumentDetail)
def get_document_detail(
    document_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> DocumentDetail:
    doc = get_document_or_404(db, document_id)

    is_owner = (doc.owner_id == current_user.id)
    owner_dept_id = doc.owner.department_id if doc.owner else None
    same_department = bool(current_user.department_id and owner_dept_id and current_user.department_id == owner_dept_id)

    if not (is_owner or user_can_view_document(db, document_id, current_user.department_id)):
        raise HTTPException(status_code=403, detail="Not authorized to view this document")

    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        current_version_number=doc.current_version_number,
        tags=[t.name for t in doc.tags],
        owner_id=doc.owner_id,
        owner_department_id=owner_dept_id,
        can_upload_version=(is_owner or same_department),
        can_edit_metadata=is_owner,
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

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    version: Optional[str] = Query(default="latest"),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
):
    doc = get_document_or_404(db, document_id)
    if doc.owner_id != current_user.id and not user_can_download_document(db, document_id, current_user.department_id):
        raise HTTPException(status_code=403, detail="Not authorized to download this document")
    try:
        v = resolve_version(db, doc, version)
    except ValueError as e:
        if str(e) == "not_found":
            raise HTTPException(status_code=404, detail="Version not found")
        raise HTTPException(status_code=400, detail="Invalid version")

    return FileResponse(
        path=v.file_path,
        media_type=v.mime_type or "application/octet-stream",
        filename=v.file_path.split("/")[-1],
    )


@router.post("/{document_id}/version", response_model=DocumentVersionInfo, status_code=status.HTTP_201_CREATED)
def upload_new_version(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> DocumentVersionInfo:
    doc = get_document_or_404(db, document_id)
    # allowed: owner or same department as owner
    if not can_upload_new_version(doc, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to upload a new version")

    v = add_new_version(db, doc, current_user, file)
    return DocumentVersionInfo(
        id=v.id,
        version_number=v.version_number,
        uploaded_by_name=v.uploaded_by_name,
        uploaded_at=v.uploaded_at.isoformat() if v.uploaded_at else None,
        file_size=v.file_size,
        mime_type=v.mime_type,
    )


@router.put("/{document_id}", response_model=DocumentDetail)
def update_document_metadata(
    document_id: int,
    payload: DocumentUpdateRequest,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(get_current_user),
) -> DocumentDetail:
    doc = get_document_or_404(db, document_id)
    # safest: owner-only edits of metadata/permissions
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can update document metadata")

    replace_document_metadata(
        db,
        doc,
        title=payload.title,
        description=payload.description,
        tag_names=(payload.tags or None),
        permission_department_ids=(payload.permission_department_ids or None),
    )

    is_owner = (doc.owner_id == current_user.id)
    owner_dept_id = doc.owner.department_id if doc.owner else None
    same_department = bool(
        current_user.department_id and owner_dept_id and current_user.department_id == owner_dept_id
    )

    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        current_version_number=doc.current_version_number,
        tags=[t.name for t in doc.tags],
        owner_id=doc.owner_id,
        owner_department_id=owner_dept_id,
        can_upload_version=(is_owner or same_department),
        can_edit_metadata=is_owner,
    )


