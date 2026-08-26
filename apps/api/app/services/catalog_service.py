"""Catalog: categories, listings, search, and seller product management."""

import re
import unicodedata
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import Select, String, cast, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import (
    CertificationRequiredError,
    DuplicateSkuError,
    NotFoundError,
    SellerNotVerifiedError,
    ValidationError,
)
from app.core.money import normalise_currency
from app.core.pagination import decode_cursor, encode_cursor
from app.models.category import Category
from app.models.enums import ProductStatus, SellerStatus, ShipmentStatus
from app.models.order import Order, OrderItem, Shipment
from app.models.product import Product
from app.models.review import Review
from app.models.seller import Seller
from app.services import outbox_service
from app.storage import images

# Categories whose listings are regulated: a product cannot go live without at
# least one CE / FDA / ISO certification recorded (CLAUDE.md §5.5).
# Departments whose listings may not go live without a certification. The check
# walks up from the product's own category, because a product sits in a leaf
# ("masks-respirators"), never in the department itself.
REGULATED_CATEGORY_SLUGS = frozenset({"ppe", "first-aid"})

_SLUG_STRIP = re.compile(r"[^a-z0-9]+")

# A carousel, not a gallery: enough for the angles a listing needs.
MAX_PRODUCT_IMAGES = 8


def slugify(value: str) -> str:
    normalised = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return _SLUG_STRIP.sub("-", normalised.lower()).strip("-") or "item"


# --- categories -----------------------------------------------------------


async def list_categories(session: AsyncSession) -> list[Category]:
    result = await session.execute(
        select(Category)
        .order_by(Category.position, Category.name)
        .options(selectinload(Category.children))
    )
    return list(result.scalars().unique())


async def get_category_by_slug(session: AsyncSession, slug: str) -> Category:
    result = await session.execute(select(Category).where(Category.slug == slug))
    category = result.scalar_one_or_none()
    if category is None:
        raise NotFoundError("Bunday turkum mavjud emas.")
    return category


async def category_product_counts(session: AsyncSession) -> dict[str, int]:
    """Active listings per category, **including descendants**.

    A department holds no products directly — they sit in its sub-categories —
    so a direct count would report zero for every top-level category. This
    matches what browsing the category actually shows, because `list_products`
    filters by the whole subtree (`_descendant_category_ids`).
    """
    direct = {
        row[0]: row[1]
        for row in await session.execute(
            select(Product.category_id, func.count(Product.id))
            .where(Product.status == ProductStatus.ACTIVE, Product.archived_at.is_(None))
            .group_by(Product.category_id)
        )
    }

    parents = {
        row[0]: row[1] for row in await session.execute(select(Category.id, Category.parent_id))
    }

    totals: dict[str, int] = dict.fromkeys(parents, 0)
    for category_id, count in direct.items():
        # Walk up to the root, adding the count to every ancestor. The tree is
        # capped at three levels (§7); the guard is for a cycle introduced by a
        # bad edit rather than for depth.
        node: str | None = category_id
        seen: set[str] = set()
        while node is not None and node not in seen:
            seen.add(node)
            totals[node] = totals.get(node, 0) + count
            node = parents.get(node)
    return totals


async def _descendant_category_ids(session: AsyncSession, root: Category) -> list[str]:
    """Category trees are capped at three levels (§7), so two hops is the whole tree."""
    ids = [root.id]
    frontier = [root.id]
    for _ in range(2):
        if not frontier:
            break
        result = await session.execute(select(Category.id).where(Category.parent_id.in_(frontier)))
        frontier = [row[0] for row in result]
        ids.extend(frontier)
    return ids


# --- product queries ------------------------------------------------------


def _visible(stmt: Select[Any]) -> Select[Any]:
    """Only listings a shopper is allowed to see."""
    return stmt.where(Product.status == ProductStatus.ACTIVE, Product.archived_at.is_(None))


def _search_clause(session: AsyncSession, term: str) -> Any:
    """Full-text match on name + description.

    Postgres is the deployment target and gets a real `tsquery` against the GIN
    index; SQLite (used by the fast unit suite) falls back to a LIKE scan so the
    same service code runs in both places.
    """
    if session.bind is not None and session.bind.dialect.name == "postgresql":
        vector = func.to_tsvector("english", Product.name + " " + Product.description)
        return vector.op("@@")(func.websearch_to_tsquery("english", term))
    pattern = f"%{term.lower()}%"
    return or_(
        func.lower(Product.name).like(pattern),
        func.lower(Product.description).like(pattern),
        func.lower(func.coalesce(Product.brand, "")).like(pattern),
    )


async def list_products(
    session: AsyncSession,
    *,
    filters: Any,
    limit: int = 24,
    cursor: str | None = None,
) -> tuple[list[Product], str | None]:
    """Filtered, cursor-paginated catalog listing.

    Every filter is whitelisted by `ProductFilters` — no client-supplied column
    names or sort expressions ever reach SQL (§6).
    """
    stmt = _visible(
        select(Product).options(selectinload(Product.seller), selectinload(Product.category))
    )

    if filters.category:
        category = await get_category_by_slug(session, filters.category)
        stmt = stmt.where(
            Product.category_id.in_(await _descendant_category_ids(session, category))
        )
    if filters.seller:
        seller_id = await session.scalar(select(Seller.id).where(Seller.slug == filters.seller))
        if seller_id is None:
            raise NotFoundError("Bunday sotuvchi mavjud emas.")
        stmt = stmt.where(Product.seller_id == seller_id)
    if filters.q:
        stmt = stmt.where(_search_clause(session, filters.q))
    if filters.brand:
        stmt = stmt.where(func.lower(Product.brand) == filters.brand.lower())
    if filters.certification:
        # JSON containment differs per dialect; a LIKE on the serialised array is
        # portable and the certification set is tiny (CE / FDA / ISO).
        stmt = stmt.where(
            cast(Product.certifications, String).like(f'%"{filters.certification.value}"%')
        )
    if filters.min_price_minor is not None:
        stmt = stmt.where(Product.price_amount_minor >= filters.min_price_minor)
    if filters.max_price_minor is not None:
        stmt = stmt.where(Product.price_amount_minor <= filters.max_price_minor)
    if filters.in_stock:
        stmt = stmt.where(Product.stock > 0)
    if filters.prescription_required is not None:
        stmt = stmt.where(Product.prescription_required.is_(filters.prescription_required))
    if filters.on_sale:
        stmt = stmt.where(Product.compare_at_amount_minor.is_not(None))

    sort_column, descending = {
        "relevance": (Product.id, True),
        "newest": (Product.id, True),
        "price_asc": (Product.price_amount_minor, False),
        "price_desc": (Product.price_amount_minor, True),
        "rating": (Product.rating_sum, True),
    }[filters.sort]

    if cursor and (decoded := decode_cursor(cursor)):
        sort_value, last_id = decoded
        if sort_column is Product.id:
            stmt = stmt.where(Product.id < last_id if descending else Product.id > last_id)
        else:
            typed = int(sort_value) if sort_value.lstrip("-").isdigit() else 0
            stmt = stmt.where(
                or_(
                    sort_column < typed if descending else sort_column > typed,
                    (sort_column == typed) & (Product.id > last_id),
                )
            )

    ordering: list[Any] = [sort_column.desc() if descending else sort_column.asc()]
    if sort_column is not Product.id:
        ordering.append(Product.id.asc())

    rows = list((await session.execute(stmt.order_by(*ordering).limit(limit + 1))).scalars())
    next_cursor = None
    if len(rows) > limit:
        last = rows[limit - 1]
        marker = None if sort_column is Product.id else getattr(last, sort_column.key)
        next_cursor = encode_cursor(marker, last.id)
    return rows[:limit], next_cursor


async def get_product_by_slug(session: AsyncSession, slug: str) -> Product:
    result = await session.execute(
        _visible(select(Product).where(Product.slug == slug)).options(
            selectinload(Product.seller), selectinload(Product.category)
        )
    )
    product: Product | None = result.scalar_one_or_none()
    if product is None:
        raise NotFoundError("Bu mahsulot mavjud emas.")
    return product


async def related_products(
    session: AsyncSession, product: Product, limit: int = 4
) -> list[Product]:
    stmt = (
        _visible(select(Product))
        .where(Product.category_id == product.category_id, Product.id != product.id)
        .options(selectinload(Product.seller), selectinload(Product.category))
        .order_by(Product.rating_sum.desc(), Product.id.desc())
        .limit(limit)
    )
    return list((await session.execute(stmt)).scalars())


async def suggest(session: AsyncSession, term: str, limit: int = 8) -> dict[str, list[Any]]:
    """Autocomplete rows for the search bar: products, categories, brands."""
    term = term.strip()
    if len(term) < 2:
        return {"products": [], "categories": [], "brands": []}
    pattern = f"{term.lower()}%"
    contains = f"%{term.lower()}%"

    products = list(
        (
            await session.execute(
                _visible(select(Product))
                .where(func.lower(Product.name).like(contains))
                .order_by(Product.rating_count.desc(), Product.id.desc())
                .limit(limit)
                .options(selectinload(Product.category))
            )
        ).scalars()
    )
    categories = list(
        (
            await session.execute(
                select(Category).where(func.lower(Category.name).like(contains)).limit(4)
            )
        ).scalars()
    )
    brands = [
        row[0]
        for row in await session.execute(
            _visible(select(Product.brand).distinct())
            .where(Product.brand.is_not(None), func.lower(Product.brand).like(pattern))
            .limit(4)
        )
    ]
    return {"products": products, "categories": categories, "brands": brands}


async def list_brands(session: AsyncSession, category_slug: str | None = None) -> list[str]:
    stmt = _visible(select(Product.brand).distinct()).where(Product.brand.is_not(None))
    if category_slug:
        category = await get_category_by_slug(session, category_slug)
        stmt = stmt.where(
            Product.category_id.in_(await _descendant_category_ids(session, category))
        )
    return sorted(row[0] for row in await session.execute(stmt.order_by(Product.brand)))


# --- seller product management -------------------------------------------


def _require_verified(seller: Seller) -> None:
    if seller.status != SellerStatus.VERIFIED:
        raise SellerNotVerifiedError()


async def _is_regulated(session: AsyncSession, category: Category) -> bool:
    """True when the category, or any ancestor of it, is a regulated department."""
    node: Category | None = category
    seen: set[str] = set()
    while node is not None and node.id not in seen:
        if node.slug in REGULATED_CATEGORY_SLUGS:
            return True
        seen.add(node.id)
        node = await session.get(Category, node.parent_id) if node.parent_id else None
    return False


async def _validate_certifications(
    session: AsyncSession, category_id: str, certifications: list[str], status: str
) -> Category:
    category = await session.get(Category, category_id)
    if category is None:
        raise ValidationError("Bunday turkum mavjud emas.", details={"field": "category_id"})
    # Enforcement lives here, not in the frontend (§5.5).
    if (
        status == ProductStatus.ACTIVE
        and not certifications
        and await _is_regulated(session, category)
    ):
        raise CertificationRequiredError(
            "Bu turkumdagi e’lonlar chop etilishidan oldin CE, FDA yoki ISO "
            "sertifikatiga ega bo‘lishi kerak.",
            details={"category_id": category_id},
        )
    return category


async def _unique_slug(session: AsyncSession, base: str) -> str:
    slug = base
    suffix = 2
    while await session.scalar(select(Product.id).where(Product.slug == slug)) is not None:
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def _validate_compare_at(price_minor: int, compare_at_minor: int | None) -> None:
    """A was-price below the selling price is a pricing bug, not a discount."""
    if compare_at_minor is not None and compare_at_minor <= price_minor:
        raise ValidationError(
            "Oldingi narx joriy narxdan yuqori bo‘lishi kerak.",
            code="INVALID_COMPARE_AT_PRICE",
            details={"field": "compare_at_amount_minor"},
        )


async def _publish_catalog_change(session: AsyncSession, product: Product) -> None:
    """Queue the storefront cache bust for after this transaction commits.

    Category and product pages are served from ISR, so without this a seller's
    change is invisible until the revalidate window closes and looks like a lost
    save. Enqueued through the outbox, never inline, because the change must not
    be published if the transaction rolls back (§3.3, §3.6).
    """
    await outbox_service.emit(
        session,
        outbox_service.PRODUCT_REINDEX,
        {"product_id": product.id, "slug": product.slug},
    )


async def create_product(session: AsyncSession, seller: Seller, payload: Any) -> Product:
    """Create a listing owned by `seller`.

    The seller comes from the verified token, never from the request body (§3.5).
    """
    _require_verified(seller)
    _validate_compare_at(payload.price_amount_minor, payload.compare_at_amount_minor)
    await _validate_certifications(
        session, payload.category_id, [c.value for c in payload.certifications], payload.status
    )

    product = Product(
        seller_id=seller.id,
        category_id=payload.category_id,
        name=payload.name.strip(),
        slug=await _unique_slug(session, slugify(payload.name)),
        sku=payload.sku.strip(),
        brand=payload.brand,
        description=payload.description,
        price_amount_minor=payload.price_amount_minor,
        compare_at_amount_minor=payload.compare_at_amount_minor,
        currency=normalise_currency(payload.currency),
        stock=payload.stock,
        unit_label=payload.unit_label,
        certifications=[c.value for c in payload.certifications],
        prescription_required=payload.prescription_required,
        images=payload.images,
        specs=payload.specs,
        status=payload.status,
    )
    session.add(product)
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateSkuError(details={"sku": payload.sku}) from exc
    await _publish_catalog_change(session, product)
    return product


async def get_seller_product(session: AsyncSession, seller: Seller, product_id: str) -> Product:
    """Ownership check lives here — a seller may only reach their own rows.

    A row the seller cannot see returns 404, never 403, so the API does not
    leak the existence of another seller's listing (§3.5).
    """
    product = await session.get(Product, product_id)
    if product is None or product.seller_id != seller.id:
        raise NotFoundError("Bunday e’lon mavjud emas.")
    return product


async def update_product(
    session: AsyncSession, seller: Seller, product_id: str, payload: Any
) -> Product:
    product = await get_seller_product(session, seller, product_id)
    data = payload.model_dump(exclude_unset=True)

    if "certifications" in data and data["certifications"] is not None:
        data["certifications"] = [
            c if isinstance(c, str) else c.value for c in data["certifications"]
        ]
    target_status = data.get("status") or product.status
    target_category = data.get("category_id") or product.category_id
    target_certs = data.get("certifications", product.certifications)
    await _validate_certifications(session, target_category, target_certs, target_status)
    _validate_compare_at(
        data.get("price_amount_minor", product.price_amount_minor),
        data.get("compare_at_amount_minor", product.compare_at_amount_minor),
    )

    for field, value in data.items():
        setattr(product, field, value)
    if data.get("status") == ProductStatus.ARCHIVED:
        product.archived_at = datetime.now(UTC)
    elif "status" in data:
        product.archived_at = None
    if "name" in data and data["name"]:
        product.name = data["name"].strip()

    await session.flush()
    await _publish_catalog_change(session, product)
    return product


async def archive_product(session: AsyncSession, seller: Seller, product_id: str) -> Product:
    """Soft delete: a listing that has been ordered is never hard-deleted (§7)."""
    product = await get_seller_product(session, seller, product_id)
    product.status = ProductStatus.ARCHIVED
    product.archived_at = datetime.now(UTC)
    await session.flush()
    await _publish_catalog_change(session, product)
    return product


async def list_seller_products(
    session: AsyncSession,
    seller: Seller,
    *,
    status: str | None = None,
    q: str | None = None,
    limit: int = 24,
    cursor: str | None = None,
) -> tuple[list[Product], str | None]:
    # The ownership filter is part of the query, not applied after fetching (§3.5).
    stmt = (
        select(Product)
        .where(Product.seller_id == seller.id)
        .options(selectinload(Product.category), selectinload(Product.seller))
        .order_by(Product.id.desc())
    )
    if status:
        stmt = stmt.where(Product.status == status)
    if q:
        stmt = stmt.where(func.lower(Product.name).like(f"%{q.lower()}%"))
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Product.id < decoded[1])

    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


# --- reviews --------------------------------------------------------------


async def list_reviews(
    session: AsyncSession, product_id: str, *, limit: int = 20, cursor: str | None = None
) -> tuple[list[Review], str | None]:
    stmt = (
        select(Review)
        .where(Review.product_id == product_id)
        .options(selectinload(Review.buyer))
        .order_by(Review.id.desc())
    )
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Review.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


async def create_review(
    session: AsyncSession, buyer_id: str, product_slug: str, payload: Any
) -> Review:
    product = await get_product_by_slug(session, product_slug)
    existing = await session.scalar(
        select(Review.id).where(Review.product_id == product.id, Review.buyer_id == buyer_id)
    )
    if existing is not None:
        raise ValidationError(
            "Siz bu mahsulotga allaqachon sharh qoldirgansiz.",
            code="REVIEW_ALREADY_EXISTS",
            status=409,
        )

    # "Verified purchase" means this buyer actually received this product.
    delivered = await session.scalar(
        select(OrderItem.id)
        .join(Shipment, Shipment.id == OrderItem.shipment_id)
        .join(Order, Order.id == Shipment.order_id)
        .where(
            OrderItem.product_id == product.id,
            Order.buyer_id == buyer_id,
            Shipment.status.in_((ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED)),
        )
        .limit(1)
    )
    review = Review(
        product_id=product.id,
        buyer_id=buyer_id,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
        verified_purchase=delivered is not None,
    )
    session.add(review)
    product.rating_sum += payload.rating
    product.rating_count += 1
    await session.flush()
    return review


# --- product images -------------------------------------------------------


async def add_product_image(
    session: AsyncSession,
    seller: Seller,
    product_id: str,
    *,
    data: bytes,
    content_type: str,
) -> Product:
    """Store one photo and append it to the listing's carousel.

    Order is the list's order, so the first entry is the thumbnail the storefront
    shows. Ownership is checked by `get_seller_product` (§3.5).
    """
    product = await get_seller_product(session, seller, product_id)

    if content_type not in images.CONTENT_TYPES:
        raise ValidationError(
            "Faqat JPEG, PNG yoki WebP rasm yuklash mumkin.",
            details={"content_type": content_type},
        )
    if not data:
        raise ValidationError("Rasm fayli bo’sh.")
    if len(data) > images.MAX_IMAGE_BYTES:
        raise ValidationError(
            "Rasm hajmi 5 MB dan oshmasligi kerak.",
            details={"max_bytes": images.MAX_IMAGE_BYTES},
        )
    if len(product.images) >= MAX_PRODUCT_IMAGES:
        raise ValidationError(
            f"Bitta e’longa eng ko’pi {MAX_PRODUCT_IMAGES} ta rasm qo’shiladi.",
            details={"limit": MAX_PRODUCT_IMAGES},
        )

    key = images.build_key(product.id, content_type)
    await images.get_image_store().put(key, data, content_type)

    # Reassigned rather than appended: the column is JSON, and SQLAlchemy does
    # not track in-place mutation of a plain list.
    product.images = [*product.images, key]
    await session.flush()
    await _publish_catalog_change(session, product)
    return product


async def delete_product_image(
    session: AsyncSession, seller: Seller, product_id: str, key: str
) -> Product:
    """Drop one photo from the carousel.

    The object is removed only when this store owns the key; a seeded path is
    detached from the listing but never deleted from the web app's assets.
    """
    product = await get_seller_product(session, seller, product_id)

    # Reads hand out resolved URLs, so a client deletes using the string it was
    # given; the row stores the bare key. Match either form rather than making
    # callers reverse the resolution themselves.
    stored = next(
        (
            existing
            for existing in product.images
            if existing == key or images.resolve_url(existing) == key
        ),
        None,
    )
    if stored is None:
        raise NotFoundError("Bunday rasm topilmadi.")

    product.images = [existing for existing in product.images if existing != stored]
    await session.flush()

    if images.is_managed_key(stored):
        await images.get_image_store().delete(stored)

    await _publish_catalog_change(session, product)
    return product


# The window the storefront's "bought recently" line reports on.
PURCHASE_WINDOW_DAYS = 7


async def buyers_in_last_week(session: AsyncSession, product_id: str) -> int:
    """How many distinct buyers ordered this listing in the last week.

    Counts people, not lines: two orders from one buyer is one buyer. Only
    shipments that were actually paid for count — a basket that never settled
    is not a purchase. Derived on read, never stored.
    """
    since = datetime.now(UTC) - timedelta(days=PURCHASE_WINDOW_DAYS)
    result = await session.execute(
        select(func.count(func.distinct(Order.buyer_id)))
        .select_from(OrderItem)
        .join(Shipment, Shipment.id == OrderItem.shipment_id)
        .join(Order, Order.id == Shipment.order_id)
        .where(
            OrderItem.product_id == product_id,
            OrderItem.created_at >= since,
            Shipment.status.in_(
                [
                    ShipmentStatus.PAID,
                    ShipmentStatus.PROCESSING,
                    ShipmentStatus.SHIPPED,
                    ShipmentStatus.DELIVERED,
                ]
            ),
        )
    )
    return int(result.scalar_one() or 0)
