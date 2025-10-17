from sqlalchemy.orm import Session
from app.models.department import Department


def seed_departments(db: Session):
    defaults = ["HR", "Finance", "Legal", "IT", "Operations"]
    existing = {d.name for d in db.query(Department).all()}
    for name in defaults:
        if name not in existing:
            db.add(Department(name=name))
    db.commit()