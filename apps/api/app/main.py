"""App entrypoint: middleware, router registration, and the error handler."""

import logging
import uuid
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api import account, admin, auth, cart, catalog, checkout, orders, payments, prescriptions
from app.api import sellers as sellers_api
from app.core.config import settings
from app.core.errors import AppError
from app.core.logging import configure_logging, request_id_ctx
from app.db.session import engine

logger = logging.getLogger(__name__)

REQUEST_ID_HEADER = "X-Request-ID"


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    configure_logging(settings.log_level)
    logger.info("api starting", extra={"environment": settings.environment})
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.project_name,
    version="0.1.0",
    description=(
        "Multi-vendor marketplace for medical supplies and equipment. "
        "Money is always integer minor units plus an ISO-4217 currency."
    ),
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Guests need to read back the cart token the API mints for them.
    expose_headers=["X-Cart-Token", REQUEST_ID_HEADER],
)


@app.middleware("http")
async def request_context(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """Attach a request ID to every log line and response (§12.4)."""
    request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
    token = request_id_ctx.set(request_id)
    logger.info("request start", extra={"method": request.method, "path": request.url.path})
    try:
        response = await call_next(request)
    finally:
        request_id_ctx.reset(token)
    response.headers[REQUEST_ID_HEADER] = request_id
    logger.info(
        "request end",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
        },
    )
    return response


def _error_response(
    status_code: int, code: str, message: str, details: dict[str, Any] | None = None
) -> JSONResponse:
    """The single error envelope every failing endpoint returns (§3.4)."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
                "request_id": request_id_ctx.get(),
            }
        },
    )


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    logger.info("app error", extra={"code": exc.code, "status": exc.status})
    return _error_response(exc.status, exc.code, exc.message, exc.details)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    fields: dict[str, str] = {}
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"][1:]) or "body"
        fields[location] = error["msg"]
    return _error_response(
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        "VALIDATION_ERROR",
        "Ba’zi maydonlarni to‘g‘rilash kerak.",
        {"fields": fields},
    )


@app.exception_handler(Exception)
async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
    # Never leak an ORM or driver message to the client (§3.4).
    logger.exception("unhandled error", extra={"path": request.url.path})
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "INTERNAL_ERROR",
        "Bizning tomonimizda xatolik yuz berdi. Yuqoridagi havola muammoni topishga yordam beradi.",
    )


@app.get("/healthz", tags=["health"], operation_id="liveness")
async def healthz() -> dict[str, str]:
    """Liveness: answers without touching any dependency."""
    return {"status": "ok"}


@app.get("/readyz", tags=["health"], operation_id="readiness")
async def readyz() -> JSONResponse:
    """Readiness: the database must be reachable."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        logger.exception("readiness check failed")
        return JSONResponse(status_code=503, content={"status": "unavailable", "db": False})
    return JSONResponse(content={"status": "ok", "db": True})


prefix = settings.api_v1_prefix
for module_router in (
    auth.router,
    catalog.router,
    cart.router,
    checkout.router,
    orders.router,
    account.router,
    prescriptions.router,
    sellers_api.router,
    sellers_api.me_router,
    payments.router,
    admin.router,
):
    app.include_router(module_router, prefix=prefix)
