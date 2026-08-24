"""Category and product schemas."""

from datetime import datetime
from typing import TYPE_CHECKING, Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.money import DEFAULT_CURRENCY
from app.models.enums import Certification, ProductStatus

if TYPE_CHECKING:
    from app.models.review import Review

Slug = Annotated[str, Field(min_length=1, max_length=280, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: str | None
    icon: str | None
    parent_id: str | None
    position: int


class CategoryTree(CategoryRead):
    # Always present in a response, so it is required in the contract rather
    # than optional-with-a-default — the generated client should not have to
    # guess whether the API sent it.
    children: list["CategoryTree"]
    product_count: int = 0


class SellerSummary(BaseModel):
    """The slice of a seller a buyer is allowed to see."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    business_name: str
    slug: str
    country: str
    status: str
    verified: bool


class ProductListItem(BaseModel):
    """Slim shape for grids and search results."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    brand: str | None
    image_url: str | None = None
    price_amount_minor: int
    compare_at_amount_minor: int | None
    discount_percent: int | None
    currency: str
    unit_label: str
    in_stock: bool
    stock: int
    certifications: list[str]
    prescription_required: bool
    rating_average: float | None
    rating_count: int
    seller: SellerSummary
    category_id: str


class ProductRead(ProductListItem):
    description: str
    sku: str
    images: list[str]
    specs: dict[str, Any]
    status: str
    category: CategoryRead
    created_at: datetime


class ProductCreate(BaseModel):
    name: Annotated[str, Field(min_length=2, max_length=255)]
    category_id: str
    sku: Annotated[str, Field(min_length=1, max_length=64)]
    brand: Annotated[str | None, Field(default=None, max_length=128)] = None
    description: Annotated[str, Field(default="", max_length=20_000)] = ""
    price_amount_minor: Annotated[int, Field(ge=0)]
    compare_at_amount_minor: Annotated[int | None, Field(default=None, ge=0)] = None
    currency: Annotated[str, Field(min_length=3, max_length=3)] = DEFAULT_CURRENCY
    stock: Annotated[int, Field(ge=0)] = 0
    unit_label: Annotated[str, Field(default="unit", max_length=32)] = "unit"
    certifications: list[Certification] = Field(default_factory=list)
    prescription_required: bool = False
    images: list[str] = Field(default_factory=list)
    specs: dict[str, Any] = Field(default_factory=dict)
    status: Literal[ProductStatus.DRAFT, ProductStatus.ACTIVE] = ProductStatus.DRAFT


class ProductUpdate(BaseModel):
    """PATCH body — every field optional, `None` means 'not provided'."""

    name: Annotated[str | None, Field(default=None, min_length=2, max_length=255)] = None
    category_id: str | None = None
    brand: Annotated[str | None, Field(default=None, max_length=128)] = None
    description: Annotated[str | None, Field(default=None, max_length=20_000)] = None
    price_amount_minor: Annotated[int | None, Field(default=None, ge=0)] = None
    compare_at_amount_minor: Annotated[int | None, Field(default=None, ge=0)] = None
    stock: Annotated[int | None, Field(default=None, ge=0)] = None
    unit_label: Annotated[str | None, Field(default=None, max_length=32)] = None
    certifications: list[Certification] | None = None
    prescription_required: bool | None = None
    images: list[str] | None = None
    specs: dict[str, Any] | None = None
    status: Literal[ProductStatus.DRAFT, ProductStatus.ACTIVE, ProductStatus.ARCHIVED] | None = None


class ProductFilters(BaseModel):
    """Whitelisted list/search parameters — no raw sort expressions (§6)."""

    q: Annotated[str | None, Field(default=None, max_length=120)] = None
    category: Slug | None = None
    brand: Annotated[str | None, Field(default=None, max_length=128)] = None
    certification: Certification | None = None
    min_price_minor: Annotated[int | None, Field(default=None, ge=0)] = None
    max_price_minor: Annotated[int | None, Field(default=None, ge=0)] = None
    in_stock: bool | None = None
    prescription_required: bool | None = None
    on_sale: bool | None = None
    seller: Slug | None = None
    sort: Literal["relevance", "newest", "price_asc", "price_desc", "rating"] = "relevance"


class SearchSuggestion(BaseModel):
    """One autocomplete row."""

    type: Literal["product", "category", "brand"]
    label: str
    slug: str | None = None
    category_slug: str | None = None


class SearchSuggestions(BaseModel):
    suggestions: list[SearchSuggestion]


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rating: int
    title: str | None
    body: str
    verified_purchase: bool
    author_initials: str
    created_at: datetime

    @classmethod
    def from_model(cls, review: "Review") -> "ReviewRead":
        """Only the reviewer's initials are ever exposed — never their name."""
        parts = [p for p in (review.buyer.full_name or "").split() if p]
        initials = "".join(p[0].upper() for p in parts[:2]) or "?"
        return cls(
            id=review.id,
            rating=review.rating,
            title=review.title,
            body=review.body,
            verified_purchase=review.verified_purchase,
            author_initials=initials,
            created_at=review.created_at,
        )


class ReviewCreate(BaseModel):
    rating: Annotated[int, Field(ge=1, le=5)]
    title: Annotated[str | None, Field(default=None, max_length=160)] = None
    body: Annotated[str, Field(default="", max_length=4_000)] = ""


CategoryTree.model_rebuild()
