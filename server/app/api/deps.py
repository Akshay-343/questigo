"""Shared FastAPI dependencies: auth extraction and role guards."""
import uuid

import jwt
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.crud import user as user_crud
from app.models.user import User


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError("Missing or invalid Authorization header.", status_code=401)

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise AppError("Session expired. Please log in again.", status_code=401)
    except jwt.PyJWTError:
        raise AppError("Invalid authentication token.", status_code=401)

    sub = payload.get("sub")
    if not sub:
        raise AppError("Invalid authentication token.", status_code=401)

    try:
        user_id = uuid.UUID(str(sub))
    except ValueError:
        raise AppError("Invalid authentication token.", status_code=401)

    user = user_crud.get_by_id(db, user_id)
    if not user:
        raise AppError("Account no longer exists.", status_code=401)
    return user


def require_role(role: str):
    """Dependency factory enforcing a specific role after authentication."""

    def _guard(current: User = Depends(get_current_user)) -> User:
        if current.role != role:
            raise AppError("You do not have access to this resource.", status_code=403)
        return current

    return _guard
