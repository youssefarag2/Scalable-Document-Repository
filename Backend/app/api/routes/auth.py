from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db_dep, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from app.models.user import User
from app.models.department import Department

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db_dep)) -> MeResponse:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    department = None
    if data.department_id:
        department = db.query(Department).get(data.department_id)
        if not department:
            raise HTTPException(status_code=400, detail="Invalid department_id")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        department_id=data.department_id,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return MeResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        department_name=department.name if department else None,
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db_dep)) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token(
        {
            "sub": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role or "employee",
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None,
        }
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        department_id=current_user.department_id,
        department_name=current_user.department.name if current_user.department else None,
    )