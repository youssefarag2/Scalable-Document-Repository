from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentVersion, Tag, DocumentPermission
from app.models.user import User
from app.core.files import save_upload_for_version


def parse_csv(csv: Optional[str]) -> List[str]:
    if not csv:
        return []
    return [s.strip() for s in csv.split(",") if s.strip()]


def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    if not tag_names:
        return []
    existing = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_names = {t.name for t in existing}
    to_create = [Tag(name=n) for n in tag_names if n not in existing_names]
    for t in to_create:
        db.add(t)
    if to_create:
        db.flush()
    return existing + to_create


def set_document_permissions(
    db: Session, document: Document, department_ids: List[int]
) -> None:
    # If no departments provided, default to uploader's department (common UX)
    existing = { (p.document_id, p.department_id) for p in document.permissions }
    for dep_id in department_ids:
        key = (document.id, dep_id)
        if key in existing:
            continue
        db.add(DocumentPermission(document_id=document.id, department_id=dep_id, can_view=1, can_download=1))


def create_document_with_v1(
    db: Session,
    current_user: User,
    title: str,
    description: Optional[str],
    tag_names: List[str],
    permitted_department_ids: List[int],
    upload_file,  # UploadFile
) -> Tuple[Document, DocumentVersion, List[Tag]]:
    # Create base document
    doc = Document(
        title=title,
        description=description,
        current_version_number=1,
        owner_id=current_user.id,
    )
    db.add(doc)
    db.flush()  # get doc.id

    # Persist the file for version 1
    file_path, file_size, mime = save_upload_for_version(doc.id, 1, upload_file)
    v1 = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        file_path=file_path,
        mime_type=mime,
        file_size=file_size,
        uploaded_by=current_user.id,
        uploaded_by_name=current_user.name,
    )
    db.add(v1)

    # Tags
    tags = get_or_create_tags(db, tag_names)
    if tags:
        doc.tags = tags

    # Permissions (default to user's department if none provided)
    if not permitted_department_ids and current_user.department_id:
        permitted_department_ids = [current_user.department_id]
    set_document_permissions(db, doc, permitted_department_ids)

    db.commit()
    db.refresh(doc)
    db.refresh(v1)
    return doc, v1, tags



def user_can_view_document(db: Session, document_id: int, user_department_id: Optional[int]) -> bool:
    if not user_department_id:
        return False
    exists = (
        db.query(DocumentPermission)
        .filter(
            DocumentPermission.document_id == document_id,
            DocumentPermission.department_id == user_department_id,
            DocumentPermission.can_view == 1,
        )
        .first()
        is not None
    )
    return exists


def get_document_or_404(db: Session, document_id: int) -> Document:
    doc = db.query(Document).get(document_id)
    if not doc:
        raise ValueError("not_found")
    return doc


def get_versions_for_document(db: Session, document_id: int) -> List[DocumentVersion]:
    return (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )