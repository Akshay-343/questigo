"""Application-level error type and exception handlers that enforce the
standard { "data": null, "error": "message" } response shape."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import fail


class AppError(Exception):
    """Raised by services for expected, client-facing failures."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content=fail(exc.message))

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return JSONResponse(status_code=exc.status_code, content=fail(detail))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        first = exc.errors()[0] if exc.errors() else None
        message = "Invalid request."
        if first:
            loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
            message = f"{loc}: {first.get('msg')}" if loc else first.get("msg", message)
        return JSONResponse(status_code=422, content=fail(message))
