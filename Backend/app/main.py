from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.db.migrate import init_db
from app.api.routes import auth as auth_routes
from app.api.routes import documents as documents_routes
from app.api.routes import users as users_routes
from app.api.routes import reference as reference_routes


app = FastAPI(title="Scalable Document Repository")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(reference_routes.router)
app.include_router(auth_routes.router)
app.include_router(documents_routes.router)
app.include_router(users_routes.router)

@app.get("/health")
def health():
    return {"status": "ok"}