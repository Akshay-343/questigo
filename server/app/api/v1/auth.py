"""Authentication routes: register, login, current user."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserOut
from app.schemas.common import Envelope, ok
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Envelope[AuthResponse], status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user, token = auth_service.register(db, payload)
    return ok(AuthResponse(user=UserOut.model_validate(user), token=token))


@router.post("/login", response_model=Envelope[AuthResponse])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user, token = auth_service.login(db, payload)
    return ok(AuthResponse(user=UserOut.model_validate(user), token=token))


@router.get("/me", response_model=Envelope[UserOut])
def me(current=Depends(get_current_user)):
    return ok(UserOut.model_validate(current))
