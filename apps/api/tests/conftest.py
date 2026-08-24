"""Test fixtures.

Integration tests run against a real Postgres (CLAUDE.md §11) — never SQLite,
because the dialects differ exactly where this app is interesting: `FOR UPDATE`,
JSON operators, partial indexes, and the stock CHECK constraint.

Start one with `docker compose up -d db` before running the suite.
"""

import itertools
import os
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.enums import ProductStatus, SellerStatus, UserRole
from app.models.product import Product
from app.models.seller import Seller
from app.models.user import User

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://medsupply:medsupply@localhost:5432/medsupply_test",
)


@pytest_asyncio.fixture(scope="session")
async def engine() -> AsyncGenerator[Any, None]:
    admin_url = TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    database = TEST_DATABASE_URL.rsplit("/", 1)[1]
    admin_engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
    async with admin_engine.connect() as connection:
        await connection.exec_driver_sql(f'DROP DATABASE IF EXISTS "{database}"')
        await connection.exec_driver_sql(f'CREATE DATABASE "{database}"')
    await admin_engine.dispose()

    test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=None)
    async with test_engine.begin() as connection:
        # Owned by the initial migration; the schema here is built straight
        # from the metadata, so the extension has to be enabled explicitly.
        await connection.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS citext")
        await connection.run_sync(Base.metadata.create_all)
    yield test_engine
    await test_engine.dispose()


@pytest_asyncio.fixture
async def connection(engine: Any) -> AsyncGenerator[Any, None]:
    """One connection per test, inside a transaction that is always rolled back.

    Tests never depend on each other's data or on execution order (§11).
    """
    async with engine.connect() as conn:
        transaction = await conn.begin()
        yield conn
        await transaction.rollback()


@pytest_asyncio.fixture
def session_maker(connection: Any) -> Any:
    return async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
        # Lets the app's own commit/rollback run inside the outer transaction.
        join_transaction_mode="create_savepoint",
    )


@pytest_asyncio.fixture
async def session(session_maker: Any) -> AsyncGenerator[AsyncSession, None]:
    """The test's own session, used by the factories and by assertions."""
    async with session_maker() as db_session:
        yield db_session


@pytest_asyncio.fixture
async def client(session: AsyncSession, session_maker: Any) -> AsyncGenerator[AsyncClient, None]:
    """An HTTP client whose requests get their *own* session on the same
    connection.

    Sharing one session with the test would mean a request that ends in a
    rollback also unwound the test's fixture rows.
    """

    async def _get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as request_session:
            yield request_session

    app.dependency_overrides[get_db] = _get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test/api/v1") as http:
        yield http
    app.dependency_overrides.clear()


# --- factories ------------------------------------------------------------
# Factories, not module-level constants, so tests can vary one field cheaply.
# They commit: a request that ends in an error rolls the session back, and the
# fixture rows must survive that. The outer transaction still discards
# everything when the test finishes.


@pytest.fixture
def make_user(session: AsyncSession):
    async def _make(
        email: str = "buyer@example.com",
        role: str = UserRole.BUYER,
        password: str = "correct-horse-battery",
        full_name: str = "Test Buyer",
        is_active: bool = True,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            is_active=is_active,
        )
        session.add(user)
        await session.commit()
        return user

    return _make


@pytest.fixture
def make_seller(session: AsyncSession, make_user):
    counter = itertools.count(1)

    async def _make(
        business_name: str = "Test Medical",
        status: str = SellerStatus.VERIFIED,
        email: str | None = None,
        country: str = "US",
    ) -> Seller:
        index = next(counter)
        email = email or f"seller{index}@example.com"
        owner = await make_user(email=email, role=UserRole.SELLER, full_name=business_name)
        seller = Seller(
            user_id=owner.id,
            business_name=business_name,
            slug=f"{business_name.lower().replace(' ', '-')}-{index}",
            country=country,
            contact_email=email,
            status=status,
        )
        session.add(seller)
        await session.commit()
        return seller

    return _make


@pytest.fixture
def make_category(session: AsyncSession):
    """Cached by slug so a test can ask for the same category twice."""
    cache: dict[str, Category] = {}

    async def _make(
        name: str = "Protective equipment",
        slug: str = "ppe",
        parent: Category | None = None,
    ) -> Category:
        if slug not in cache:
            category = Category(name=name, slug=slug, parent_id=parent.id if parent else None)
            session.add(category)
            await session.commit()
            cache[slug] = category
        return cache[slug]

    return _make


@pytest.fixture
def make_product(session: AsyncSession, make_seller, make_category):
    async def _make(
        seller: Seller | None = None,
        category: Category | None = None,
        name: str = "Digital thermometer",
        slug: str | None = None,
        price_amount_minor: int = 1999,
        stock: int = 10,
        prescription_required: bool = False,
        certifications: list[str] | None = None,
        status: str = ProductStatus.ACTIVE,
        sku: str = "SKU-1",
        brand: str = "Carevale",
    ) -> Product:
        seller = seller or await make_seller()
        category = category or await make_category()
        product = Product(
            seller_id=seller.id,
            category_id=category.id,
            name=name,
            slug=slug or name.lower().replace(" ", "-"),
            sku=sku,
            brand=brand,
            description=f"{name} for clinical use.",
            price_amount_minor=price_amount_minor,
            currency="USD",
            stock=stock,
            certifications=certifications if certifications is not None else ["CE"],
            prescription_required=prescription_required,
            status=status,
        )
        session.add(product)
        await session.commit()
        return product

    return _make


@pytest.fixture
def auth_headers(session: AsyncSession):
    """Bearer header for a user, using the app's own token issuer.

    A request that returns an error rolls the session back, which expires every
    ORM object the test is holding, so the user is refreshed before its
    attributes are read.
    """
    from sqlalchemy import inspect

    from app.services.auth_service import issue_tokens

    async def _headers(user: User) -> dict[str, str]:
        if inspect(user).expired:
            await session.refresh(user)
        access, _, _ = issue_tokens(user)
        return {"Authorization": f"Bearer {access}"}

    return _headers
