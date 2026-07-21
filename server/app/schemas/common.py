"""Standard API response envelope: { "data": ..., "error": ... }."""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    data: T | None = None
    error: str | None = None


def ok(data: T) -> dict:
    return {"data": data, "error": None}


def fail(message: str) -> dict:
    return {"data": None, "error": message}
