## Scalable Document Repository (POC)

End-to-end demo of a secure, scalable document repository with versioning, tags, and department-based permissions.

### Stack
- Frontend: Next.js (App Router, TypeScript, Tailwind)
- Backend: FastAPI (Python), SQLAlchemy, Pydantic
- Database: PostgreSQL (via Docker Compose)
- Auth: JWT (HS256), Argon2 password hashing
- Storage: Local disk under `Backend/storage/` (swappable to S3 later)

---

## Prerequisites
- Docker and Docker Compose
- Python 3.11+ (we used 3.13)
- Node.js 18+ and npm

---

## 1) Database (Docker Compose)

From the Backend directory:

```bash
cd Backend
cp .env.example .env
docker compose up -d
```

Check health:

```bash
docker compose ps
docker logs siemens_repo_db --tail 50
```

> Note: `.env` drives both the DB container and the backend connection. If you change credentials, `docker compose down -v` and `docker compose up -d` to re-init the volume.

---

## 2) Backend (FastAPI)

From the Backend directory:

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload

# Or explicit host/port
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend defaults (from `.env.example`):

```ini
APP_ENV=development
SECRET_KEY=change_me_in_prod
ACCESS_TOKEN_EXPIRE_MINUTES=60
POSTGRES_USER=youssef
POSTGRES_PASSWORD=password
POSTGRES_DB=siemens_repo
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ORIGINS=http://localhost:3000
```

Key endpoints (JWT required unless noted):

- Auth
  - POST `/api/auth/register` (public)
  - POST `/api/auth/login` (public) → `{ access_token, token_type }`
  - GET `/api/auth/me`
- Documents
  - POST `/api/documents/upload` (multipart)
  - GET `/api/documents` (accessible latest)
  - GET `/api/documents/search?title=&tags=&description=&version=`
  - GET `/api/documents/{id}` (details + capability flags)
  - GET `/api/documents/{id}/versions`
  - GET `/api/documents/{id}/download?version=latest|n`
  - POST `/api/documents/{id}/version` (owner or same department)
  - PUT `/api/documents/{id}` (owner-only; update metadata/tags/permissions)
- Users
  - GET `/api/users/me/documents` (owner’s docs)
- Reference
  - GET `/api/departments` (public)
  - GET `/api/tags`

Files are saved under `Backend/storage/doc_<id>/v<version>_*`.

---

## 3) Frontend (Next.js)

From the Frontend directory:

```bash
cd Frontend
npm install

# Configure API base URL
printf "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000\n" > .env.local

# Run dev server
npm run dev
# open http://localhost:3000
```

Notes:
- `node_modules` is not committed; run `npm install` to download dependencies declared in `package.json`/`package-lock.json`.
- Use `.env.local` to configure the API base URL per environment.

Login/Register store the token in `localStorage`. Authenticated pages are guarded and show a sidebar:
- All Documents (list + search)
- My Documents
- Upload Document
- Document Detail (versions, download, conditional actions)

---

## 4) Quick Test Flow
1) Start DB: `docker compose up -d` (Backend)
2) Start Backend: `uvicorn app.main:app --reload`
3) Start Frontend: `npm run dev`
4) Register user (e.g., HR department), login, upload a PDF with tags and permissions.
5) Register a second user in another department and verify permissions (only shared-permission docs appear).

Reset data (optional): see truncate command in the DB section.

---

## 5) Notes
- Permissions: `document_permissions` rows decide department visibility; owner always sees their documents (via My Documents and details). Download checks `can_download`.
- Versioning: server-controlled increments; lists/search show only latest; details show full history.
- The backend returns capability flags (`can_upload_version`, `can_edit_metadata`) for the details view; the frontend hides/show actions accordingly.

---


