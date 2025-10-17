from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models import user  
from app.db.init_db import seed_departments


def init_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_departments(db)


if __name__ == "__main__":
    init_db()