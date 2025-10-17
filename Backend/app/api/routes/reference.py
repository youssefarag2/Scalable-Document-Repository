from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db_dep, get_current_user
from app.models.department import Department
from app.models.document import Tag

router = APIRouter(prefix="/api", tags=["reference"])


@router.get("/departments")
def list_departments(db: Session = Depends(get_db_dep)):
    rows = db.query(Department).order_by(Department.name.asc()).all()
    return [{"id": d.id, "name": d.name} for d in rows]


@router.get("/tags")
def list_tags(
    db: Session = Depends(get_db_dep),
    user=Depends(get_current_user),
):
    rows = db.query(Tag).order_by(Tag.name.asc()).all()
    return [{"id": t.id, "name": t.name} for t in rows]