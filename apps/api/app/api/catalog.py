"""Storefront catalog: categories, listings, search, product detail, reviews."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import Cursor, Limit, Transaction
from app.auth import CurrentUser, DbSession
from app.schemas.catalog import (
    CategoryTree,
    ProductFilters,
    ProductListItem,
    ProductRead,
    ReviewCreate,
    ReviewRead,
    SearchSuggestion,
    SearchSuggestions,
)
from app.schemas.common import Page
from app.services import catalog_service

router = APIRouter(tags=["catalog"], dependencies=[Transaction])


@router.get(
    "/categories",
    response_model=list[CategoryTree],
    operation_id="listCategories",
)
async def list_categories(session: DbSession) -> list[CategoryTree]:
    """The full category tree with live product counts, for navigation and filters."""
    categories = await catalog_service.list_categories(session)
    counts = await catalog_service.category_product_counts(session)
    by_parent: dict[str | None, list[CategoryTree]] = {}
    nodes = {
        c.id: CategoryTree.model_validate(c, from_attributes=True).model_copy(
            update={"product_count": counts.get(c.id, 0), "children": []}
        )
        for c in categories
    }
    for category in categories:
        by_parent.setdefault(category.parent_id, []).append(nodes[category.id])
    for category in categories:
        nodes[category.id].children = by_parent.get(category.id, [])
    return by_parent.get(None, [])


@router.get("/products", response_model=Page[ProductListItem], operation_id="listProducts")
async def list_products(
    session: DbSession,
    filters: Annotated[ProductFilters, Depends()],
    limit: Limit = 24,
    cursor: Cursor = None,
) -> Page[ProductListItem]:
    """Browse and filter the catalog. All filters are whitelisted; paging is by cursor."""
    products, next_cursor = await catalog_service.list_products(
        session, filters=filters, limit=limit, cursor=cursor
    )
    return Page(
        items=[ProductListItem.model_validate(p) for p in products], next_cursor=next_cursor
    )


@router.get("/products/brands", response_model=list[str], operation_id="listBrands")
async def list_brands(
    session: DbSession,
    category: Annotated[str | None, Query(description="Restrict to one category slug.")] = None,
) -> list[str]:
    """Brand facet values, optionally scoped to a category."""
    return await catalog_service.list_brands(session, category)


@router.get("/search/suggest", response_model=SearchSuggestions, operation_id="suggestSearch")
async def suggest(
    session: DbSession,
    q: Annotated[str, Query(min_length=1, max_length=120, description="Partial query.")],
) -> SearchSuggestions:
    """Autocomplete rows for the search bar: products, categories, and brands."""
    found = await catalog_service.suggest(session, q)
    suggestions = [
        SearchSuggestion(type="category", label=c.name, slug=c.slug, category_slug=c.slug)
        for c in found["categories"]
    ]
    suggestions += [SearchSuggestion(type="brand", label=b) for b in found["brands"]]
    suggestions += [
        SearchSuggestion(
            type="product",
            label=p.name,
            slug=p.slug,
            category_slug=p.category.slug if p.category else None,
        )
        for p in found["products"]
    ]
    return SearchSuggestions(suggestions=suggestions)


@router.get("/products/{slug}", response_model=ProductRead, operation_id="getProduct")
async def get_product(slug: str, session: DbSession) -> ProductRead:
    """Full product detail, including specs, certifications, and seller."""
    product = await catalog_service.get_product_by_slug(session, slug)
    return ProductRead.model_validate(product)


@router.get(
    "/products/{slug}/related",
    response_model=list[ProductListItem],
    operation_id="listRelatedProducts",
)
async def related(slug: str, session: DbSession) -> list[ProductListItem]:
    """Other listings in the same category."""
    product = await catalog_service.get_product_by_slug(session, slug)
    return [
        ProductListItem.model_validate(p)
        for p in await catalog_service.related_products(session, product)
    ]


@router.get(
    "/products/{slug}/reviews",
    response_model=Page[ReviewRead],
    operation_id="listProductReviews",
)
async def list_reviews(
    slug: str, session: DbSession, limit: Limit = 20, cursor: Cursor = None
) -> Page[ReviewRead]:
    """Reviews for a product. Only the reviewer's initials are exposed."""
    product = await catalog_service.get_product_by_slug(session, slug)
    reviews, next_cursor = await catalog_service.list_reviews(
        session, product.id, limit=limit, cursor=cursor
    )
    return Page(items=[ReviewRead.from_model(r) for r in reviews], next_cursor=next_cursor)


@router.post(
    "/products/{slug}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="createProductReview",
)
async def create_review(
    slug: str, payload: ReviewCreate, session: DbSession, user: CurrentUser
) -> ReviewRead:
    """Leave a review. One per buyer per product; verified purchases are marked."""
    review = await catalog_service.create_review(session, user.id, slug, payload)
    review.buyer = user
    return ReviewRead.from_model(review)
