import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile

STORAGE_ROOT = Path("storage")

def ensure_storage_root() -> None:
    STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

def build_document_dir(document_id:int) -> Path:
    ensure_storage_root()
    doc_dir = STORAGE_ROOT / f"doc_{document_id}"
    doc_dir.mkdir(parents=True, exist_ok=True)
    return doc_dir

def save_upload_for_version(document_id: int, version_number: int, file: UploadFile) -> Tuple[str, int, str]:
    """
    Saves the uploaded file under storage/doc_{document_id}/v{version}_{random}_{original_name}
    Returns: (file_path, file_size_bytes, mime_type)
    """
    doc_dir = build_document_dir(document_id)
    safe_name = file.filename or "file"
    unique = uuid.uuid4().hex[:8]
    target = doc_dir / f"v{version_number}_{unique}_{safe_name}"
    # stream to disk
    with target.open("wb") as out:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
    # reset stream position for safety
    try:
        file.file.seek(0)
    except Exception:
        pass
    size = target.stat().st_size
    mime = file.content_type or "application/octet-stream"
    return (str(target.resolve()), size, mime)

