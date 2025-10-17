from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models import user as user_models 
from app.models import department as department_models 
from app.models import document as document_models  # noqa: F401
from app.db.init_db import seed_departments


def init_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_departments(db)


if __name__ == "__main__":
    init_db()