"""Storefront cache jobs.

Arguments are IDs only; the job re-reads current state (CLAUDE.md §3.6).
"""

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.product import Product

logger = logging.getLogger(__name__)

# Mirrors CACHE_TAGS in apps/web/lib/api-client/endpoints.ts, which the web app's
# revalidate route validates against.
CATALOG_TAG = "catalog"


async def revalidate_storefront(ctx: dict[str, Any], product_id: str) -> None:
    """Bust the storefront's ISR tags for a changed listing.

    Category and product pages are cached (§3.8), so without this a seller's
    edit stays invisible until the window closes and reads as a lost save.

    Idempotent by construction: busting a tag twice is the same as once, and a
    product deleted between the emit and this run simply busts the catalog tag.
    """
    if not settings.revalidate_secret:
        logger.info("revalidate skipped: REVALIDATE_SECRET is not set")
        return

    async with SessionLocal() as session:
        product = await session.get(Product, product_id)
        slug = product.slug if product else None

    # The whole-catalog tag covers the category and listing pages; the per-slug
    # tag covers that product's own page.
    tags = [CATALOG_TAG] + ([f"product:{slug}"] if slug else [])
    url = f"{settings.web_base_url.rstrip('/')}/api/revalidate"

    async with httpx.AsyncClient(timeout=10) as client:
        for tag in tags:
            response = await client.post(
                url,
                json={"tag": tag},
                headers={"x-revalidate-secret": settings.revalidate_secret},
            )
            # Raise so arq retries: a failed bust leaves the storefront stale,
            # which is exactly the bug this job exists to prevent.
            response.raise_for_status()

    logger.info("storefront revalidated", extra={"product_id": product_id, "tags": len(tags)})
