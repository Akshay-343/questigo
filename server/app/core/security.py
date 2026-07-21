"""Password hashing (bcrypt) and JWT helpers."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash.

    Accepts hashes produced by Python's bcrypt and by Postgres pgcrypto
    (crypt() + gen_salt('bf')) — both are standard bcrypt and interoperable.
    """
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, role: str) -> str:
    """Create a signed JWT carrying the user id (sub) and role."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
