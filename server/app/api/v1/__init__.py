"""API v1 router aggregator."""
from fastapi import APIRouter

from app.api.v1 import auth, content, student, teacher

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(content.router)
api_router.include_router(student.router)
api_router.include_router(student.leaderboard_router)
api_router.include_router(teacher.router)
