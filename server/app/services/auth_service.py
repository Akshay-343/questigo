"""Authentication business logic (fat service, thin route handlers)."""
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import create_access_token, hash_password, verify_password
from app.crud import user as user_crud
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


def register(db: Session, payload: RegisterRequest) -> tuple[User, str]:
    """Register a new STUDENT account. Teacher accounts are seeded, not self-registered."""
    existing = user_crud.get_by_email(db, payload.email)
    if existing:
        raise AppError("An account with this email already exists.", status_code=409)

    user = user_crud.create(
        db,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role="STUDENT",
    )
    token = create_access_token(user.id, user.role)
    return user, token


def login(db: Session, payload: LoginRequest) -> tuple[User, str]:
    user = user_crud.get_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise AppError("Invalid email or password.", status_code=401)

    token = create_access_token(user.id, user.role)
    return user, token
