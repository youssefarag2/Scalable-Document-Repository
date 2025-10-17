from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentCreateForm(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    tags_csv: Optional[str] = None               # e.g. "Finance,Legal"
    permission_department_ids_csv: Optional[str] = None  # e.g. "1,2"


class DocumentSummary(BaseModel):
    id: int
    title: str
    current_version_number: int
    tags: List[str]
    updated_at: Optional[str]


class DocumentDetail(BaseModel):
    id: int
    title: str
    description: Optional[str]
    current_version_number: int
    tags: List[str]
    owner_id: Optional[int]