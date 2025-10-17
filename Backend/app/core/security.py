from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.settings import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

def hash_password(plain_password:str) -> str:
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, password_hash:str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(claims: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    to_encode = {**claims, "exp": expire, "iat": datetime.now(tz=timezone.utc)}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError("Invalid token") from e