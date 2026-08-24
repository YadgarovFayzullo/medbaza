"""Domain errors.

Services raise these; they never raise `HTTPException`. A single handler in
`app.main` maps them onto the fixed error envelope described in CLAUDE.md §3.4.
"""

from typing import Any


class AppError(Exception):
    """Base for every error the API deliberately returns to a client.

    `code` is part of the public contract — renaming one is a breaking change.
    `details` must never carry PHI or PII: IDs only.
    """

    code: str = "INTERNAL_ERROR"
    message: str = "Nimadir noto‘g‘ri ketdi."
    status: int = 500

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        status: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.message
        self.code = code or self.code
        self.status = status or self.status
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppError):
    code = "NOT_FOUND"
    message = "Resurs topilmadi."
    status = 404


class ValidationError(AppError):
    code = "VALIDATION_ERROR"
    message = "So‘rovni tekshirib bo‘lmadi."
    status = 422


class ConflictError(AppError):
    code = "CONFLICT"
    message = "So‘rov joriy holatga zid keladi."
    status = 409


class AuthenticationError(AppError):
    code = "NOT_AUTHENTICATED"
    message = "Tizimga kirish talab qilinadi."
    status = 401


class PermissionError_(AppError):
    code = "FORBIDDEN"
    message = "Sizda bu resursga ruxsat yo‘q."
    status = 403


# --- domain-specific ------------------------------------------------------


class EmailAlreadyRegisteredError(ConflictError):
    code = "EMAIL_ALREADY_REGISTERED"
    message = "Bu elektron pochta allaqachon ro‘yxatdan o‘tgan."


class InvalidCredentialsError(AuthenticationError):
    code = "INVALID_CREDENTIALS"
    # Deliberately identical whether or not the account exists (CLAUDE.md §12.1).
    message = "Pochta yoki parol noto‘g‘ri."


class InsufficientStockError(ConflictError):
    code = "INSUFFICIENT_STOCK"
    message = "Bu so‘rovni bajarish uchun qoldiq yetarli emas."


class DuplicateSkuError(ConflictError):
    code = "DUPLICATE_SKU"
    message = "Sizda bu SKU bilan e’lon allaqachon bor."


class SellerNotVerifiedError(PermissionError_):
    code = "SELLER_NOT_VERIFIED"
    message = "Sotuvchi hisobingiz hali tasdiqlanmagan."


class CertificationRequiredError(ValidationError):
    code = "CERTIFICATION_REQUIRED"
    message = "Bu turkum kamida bitta sertifikatni talab qiladi."


class PrescriptionRequiredError(ConflictError):
    code = "PRESCRIPTION_REQUIRED"
    message = "Buyurtmada retsept bo‘yicha beriladigan mahsulotlar bor."


class PrescriptionNotApprovedError(ConflictError):
    code = "PRESCRIPTION_NOT_APPROVED"
    message = "Bu buyurtma uchun retsept hali tasdiqlanmagan."


class InvalidStateTransitionError(ConflictError):
    code = "INVALID_STATE_TRANSITION"
    message = "Joriy holatdan bunday o‘zgartirishga ruxsat yo‘q."


class EmptyCartError(ConflictError):
    code = "EMPTY_CART"
    message = "Savatingiz bo‘sh."


class MixedCurrencyError(ConflictError):
    code = "MIXED_CURRENCY"
    message = "Buyurtmadagi barcha mahsulotlar bitta valyutada bo‘lishi kerak."


class IdempotencyConflictError(ConflictError):
    code = "IDEMPOTENCY_KEY_REUSED"
    message = "Bu idempotentlik kaliti boshqa so‘rov tanasi bilan ishlatilgan."
