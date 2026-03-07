from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from jose import JWTError, jwt

from .config import config
from .schemas import UserPublic
from .user_repository import get_user_by_email



# Password hashing without passlib due to bcrypt 4.0.0+ compatibility bug
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    # bcrypt requires bytes and max 72 bytes length
    pwd_bytes = password.encode('utf-8')[:72]
    # generate salt and hash
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    pwd_bytes = password.encode('utf-8')[:72]
    hash_bytes = password_hash.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)


def create_access_token(*, subject: str, role: str, name: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=config.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "role": role,
        "name": name,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    try:
        payload = decode_token(token)
        email: Optional[str] = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_doc = get_user_by_email(email)
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    return UserPublic(email=user_doc["email"], name=user_doc.get("name", ""), role=user_doc.get("role", "developer"))

