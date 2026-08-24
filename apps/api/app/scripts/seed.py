"""Seed a local development database.

Idempotent: re-running it tops the catalog back up rather than duplicating it.
Passwords here are obvious dev placeholders — nothing in this file is a secret,
and nothing in it is used outside `ENVIRONMENT=development`.
"""

import asyncio
import random

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.money import DEFAULT_CURRENCY
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.category import Category
from app.models.enums import Certification, ProductStatus, SellerStatus, UserRole
from app.models.product import Product
from app.models.seller import Seller
from app.models.user import Address, User
from app.services.catalog_service import slugify

DEV_PASSWORD = "MedBaza-dev-2026"

CATEGORIES: list[tuple[str, str, str, str, list[tuple[str, str]]]] = [
    (
        "Tibbiy kiyim",
        "medical-wear",
        "Shirt",
        "Klinika, dorixona va laboratoriya xodimlari uchun kostyum va xalatlar.",
        [("Kostyumlar", "scrubs"), ("Xalatlar", "lab-coats")],
    ),
    (
        "Bosh kiyimlar",
        "headwear",
        "HardHat",
        "Jarrohlik shapkalari, bandanalar va klassik kolpaklar.",
        [("Shapka va bandanalar", "surgical-caps"), ("Kolpaklar", "clinic-caps")],
    ),
    (
        "Tibbiy poyabzal",
        "medical-footwear",
        "Footprints",
        "Uzoq smena uchun yengil va yuviladigan sabo va shippaklar.",
        [("Sabolar", "clogs"), ("Shippaklar", "slippers")],
    ),
    (
        "Himoya vositalari",
        "ppe",
        "ShieldCheck",
        "Niqob va qo‘lqoplar — klinika, ish joyi va uy uchun.",
        [("Niqob va respiratorlar", "masks-respirators"), ("Qo‘lqoplar", "gloves")],
    ),
    (
        "Birinchi yordam",
        "first-aid",
        "Bandage",
        "Uy, avtomobil va ish joyi uchun aptechkalar.",
        [("Aptechkalar", "first-aid-kits")],
    ),
]

# Business name doubles as the brand shown on a card, so `_seller_for` can match
# the two without a second lookup table.
SELLERS = [
    (
        "MedTekstil",
        "UZ",
        "savdo@medtekstil.example",
        "Toshkentda tikiladigan tibbiy kostyum va xalatlar.",
    ),
    (
        "Oq Xalat",
        "UZ",
        "info@oqxalat.example",
        "Klinika xodimlari uchun bosh kiyim va poyabzal.",
    ),
    (
        "Shifo Savdo",
        "UZ",
        "buyurtma@shifosavdo.example",
        "Niqob, qo‘lqop va bir martalik himoya vositalari.",
    ),
    (
        "Salomat Market",
        "UZ",
        "hello@salomat.example",
        "Uy va avtomobil aptechkalari, birinchi yordam vositalari.",
    ),
    (
        "Tibbiy Servis",
        "UZ",
        "ariza@tibbiyservis.example",
        "Yangi sotuvchi — hujjatlari tekshiruvda.",
    ),
]

# Product photography, keyed by name — the same key `_seed_products` matches on,
# because a slug is derived from the name and an older row may still carry its
# pre-translation slug. Paths are public URLs served by the web app.
PRODUCT_IMAGES: dict[str, list[str]] = {}

# (category slug, name, brand, price in so'm, stock, certifications, Rx, photo)
# So'm has no minor unit, so the price column *is* `price_amount_minor` (§5.1).
PRODUCTS: list[tuple[str, str, str, int, int, list[Certification], bool, str]] = [
    # --- Kostyumlar --------------------------------------------------------
    (
        "scrubs",
        "Ayollar tibbiy kostyumi, oq-ko‘k",
        "MedTekstil",
        285_000,
        64,
        [],
        False,
        "scrubs-women-navy",
    ),
    (
        "scrubs",
        "Ayollar tibbiy kostyumi, gulli naqsh",
        "MedTekstil",
        265_000,
        48,
        [],
        False,
        "scrubs-women-print",
    ),
    (
        "scrubs",
        "Ayollar tibbiy kostyumi, fuksiya",
        "MedTekstil",
        295_000,
        37,
        [],
        False,
        "scrubs-women-fuchsia",
    ),
    (
        "scrubs",
        "Erkaklar tibbiy kostyumi, kulrang",
        "MedTekstil",
        310_000,
        42,
        [],
        False,
        "scrubs-men-grey",
    ),
    (
        "scrubs",
        "Erkaklar jarrohlik kostyumi, yashil",
        "MedTekstil",
        320_000,
        29,
        [],
        False,
        "scrubs-men-green",
    ),
    (
        "scrubs",
        "Erkaklar tibbiy kostyumi, naqshli",
        "MedTekstil",
        275_000,
        33,
        [],
        False,
        "scrubs-men-print",
    ),
    # --- Xalatlar ----------------------------------------------------------
    (
        "lab-coats",
        "Erkaklar tibbiy xalati, uzun",
        "MedTekstil",
        340_000,
        26,
        [],
        False,
        "labcoat-men-long",
    ),
    (
        "lab-coats",
        "Erkaklar tibbiy xalati, klassik",
        "MedTekstil",
        365_000,
        18,
        [],
        False,
        "labcoat-men-classic",
    ),
    (
        "lab-coats",
        "Ayollar tibbiy xalati, uzun",
        "MedTekstil",
        355_000,
        31,
        [],
        False,
        "labcoat-women-long",
    ),
    # --- Bosh kiyimlar -----------------------------------------------------
    (
        "clinic-caps",
        "Tibbiy kolpak, oq",
        "Oq Xalat",
        45_000,
        120,
        [],
        False,
        "cap-white-tall",
    ),
    (
        "clinic-caps",
        "Tibbiy kolpak, erkaklar uchun",
        "Oq Xalat",
        45_000,
        96,
        [],
        False,
        "cap-white-men",
    ),
    (
        "surgical-caps",
        "Jarrohlik shapkasi, pushti naqsh",
        "Oq Xalat",
        55_000,
        74,
        [],
        False,
        "cap-print-pink",
    ),
    (
        "surgical-caps",
        "Jarrohlik shapkasi, yashil naqsh",
        "Oq Xalat",
        55_000,
        68,
        [],
        False,
        "cap-print-green",
    ),
    (
        "surgical-caps",
        "Bandana-shapka, kulrang",
        "Oq Xalat",
        60_000,
        52,
        [],
        False,
        "bandana-grey",
    ),
    (
        "surgical-caps",
        "Bandana-shapka, oq",
        "Oq Xalat",
        60_000,
        58,
        [],
        False,
        "bandana-white",
    ),
    # --- Poyabzal ----------------------------------------------------------
    (
        "clogs",
        "Tibbiy sabo, krem rang",
        "Oq Xalat",
        210_000,
        44,
        [],
        False,
        "clogs-cream",
    ),
    (
        "clogs",
        "Tibbiy sabo, to‘q ko‘k",
        "Oq Xalat",
        195_000,
        61,
        [],
        False,
        "clogs-navy",
    ),
    (
        "clogs",
        "Tibbiy sabo, qora",
        "Oq Xalat",
        195_000,
        57,
        [],
        False,
        "clogs-black",
    ),
    (
        "slippers",
        "Tibbiy shippak, naqshli",
        "Oq Xalat",
        165_000,
        39,
        [],
        False,
        "slippers-print",
    ),
    # --- Niqoblar ----------------------------------------------------------
    (
        "masks-respirators",
        "Uch qatlamli tibbiy niqob, ko‘k (50 dona)",
        "Shifo Savdo",
        45_000,
        480,
        [Certification.CE],
        False,
        "mask-blue-50",
    ),
    (
        "masks-respirators",
        "Bir martalik tibbiy niqob, ko‘k (10 dona)",
        "Shifo Savdo",
        12_000,
        920,
        [Certification.CE],
        False,
        "mask-blue-10",
    ),
    (
        "masks-respirators",
        "Uch qatlamli tibbiy niqob, qora (50 dona)",
        "Shifo Savdo",
        52_000,
        310,
        [Certification.CE],
        False,
        "mask-black-50",
    ),
    (
        "masks-respirators",
        "Naqshli tibbiy niqob, oq (10 dona)",
        "Shifo Savdo",
        22_000,
        260,
        [Certification.CE],
        False,
        "mask-print-white",
    ),
    (
        "masks-respirators",
        "Naqshli tibbiy niqob, pushti (10 dona)",
        "Shifo Savdo",
        22_000,
        245,
        [Certification.CE],
        False,
        "mask-print-pink",
    ),
    # --- Qo‘lqoplar --------------------------------------------------------
    (
        "gloves",
        "Nitril qo‘lqoplar, kukunsiz (50 juft)",
        "Shifo Savdo",
        185_000,
        215,
        [Certification.CE, Certification.FDA],
        False,
        "gloves-nitrile-50",
    ),
    (
        "gloves",
        "Nitril qo‘lqoplar, binafsha rang (100 dona)",
        "Shifo Savdo",
        165_000,
        190,
        [Certification.CE],
        False,
        "gloves-nitrile-100",
    ),
    # --- Aptechkalar -------------------------------------------------------
    (
        "first-aid-kits",
        "Universal aptechka, 23x13x8 sm",
        "Salomat Market",
        95_000,
        140,
        [Certification.CE],
        False,
        "first-aid-kit-universal",
    ),
]

PRODUCT_IMAGES = {name: [f"/products/{photo}.jpg"] for _, name, *_, photo in PRODUCTS}


SPEC_POOL = {
    "Sterilligi": ["Steril", "Steril emas"],
    "Bir martalik": ["Ha", "Yo‘q"],
    "Yaroqlilik muddati": ["24 oy", "36 oy", "60 oy"],
    "Saqlash": ["25°C dan past haroratda", "Salqin, quruq joyda"],
    "Ishlab chiqarilgan davlat": ["O‘zbekiston", "Germaniya", "Turkiya"],
}


async def _seed_users(session: AsyncSession) -> dict[str, User]:
    people = {
        "admin": ("admin@medbaza.example", "Ada Ellis", UserRole.ADMIN),
        "buyer": ("buyer@medbaza.example", "Rosa Lindqvist", UserRole.BUYER),
    }
    created: dict[str, User] = {}
    for key, (email, name, role) in people.items():
        user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if user is None:
            user = User(
                email=email,
                hashed_password=hash_password(DEV_PASSWORD),
                full_name=name,
                role=role,
            )
            session.add(user)
            await session.flush()
        created[key] = user

    buyer = created["buyer"]
    has_address = await session.scalar(
        select(func.count(Address.id)).where(Address.user_id == buyer.id)
    )
    if not has_address:
        session.add(
            Address(
                user_id=buyer.id,
                label="Klinika",
                recipient_name="Rosa Lindqvist",
                line1="Amir Temur shoh ko‘chasi, 118",
                city="Toshkent",
                region="Toshkent",
                postal_code="100084",
                country="UZ",
                is_default=True,
            )
        )
    return created


async def _seed_categories(session: AsyncSession) -> dict[str, Category]:
    by_slug: dict[str, Category] = {}
    for position, (name, slug, icon, description, children) in enumerate(CATEGORIES):
        parent = (
            await session.execute(select(Category).where(Category.slug == slug))
        ).scalar_one_or_none()
        if parent is None:
            parent = Category(
                name=name, slug=slug, icon=icon, description=description, position=position
            )
            session.add(parent)
            await session.flush()
        by_slug[slug] = parent

        for child_position, (child_name, child_slug) in enumerate(children):
            child = (
                await session.execute(select(Category).where(Category.slug == child_slug))
            ).scalar_one_or_none()
            if child is None:
                child = Category(
                    name=child_name,
                    slug=child_slug,
                    parent_id=parent.id,
                    position=child_position,
                )
                session.add(child)
                await session.flush()
            by_slug[child_slug] = child
    return by_slug


async def _seed_sellers(session: AsyncSession, users: dict[str, User]) -> dict[str, Seller]:
    sellers: dict[str, Seller] = {}
    for index, (business_name, country, contact_email, description) in enumerate(SELLERS):
        seller = (
            await session.execute(select(Seller).where(Seller.slug == slugify(business_name)))
        ).scalar_one_or_none()
        if seller is None:
            owner_email = f"seller{index + 1}@medbaza.example"
            owner = (
                await session.execute(select(User).where(User.email == owner_email))
            ).scalar_one_or_none()
            if owner is None:
                owner = User(
                    email=owner_email,
                    hashed_password=hash_password(DEV_PASSWORD),
                    full_name=f"{business_name} Operations",
                    role=UserRole.SELLER,
                )
                session.add(owner)
                await session.flush()
            else:
                # The dev sign-ins are numbered, so a rebuilt catalogue reuses
                # seller1@... for whatever shop now sits at that index.
                owner.full_name = f"{business_name} Operations"

            seller = Seller(
                user_id=owner.id,
                business_name=business_name,
                slug=slugify(business_name),
                description=description,
                country=country,
                contact_email=contact_email,
                # The last seller stays pending so the admin queue is never empty.
                status=SellerStatus.PENDING if index == len(SELLERS) - 1 else SellerStatus.VERIFIED,
                license_number=f"LIC-{country}-{1000 + index}",
                certification_documents=["licence.pdf", "iso-13485.pdf"],
                payout_enabled=index != len(SELLERS) - 1,
            )
            session.add(seller)
            await session.flush()
        sellers[business_name] = seller
    return sellers


def _seller_for(brand: str, sellers: dict[str, Seller]) -> Seller:
    """Brand and shop share a name in the seed catalogue."""
    return sellers.get(brand) or sellers[SELLERS[0][0]]


def _seed_rating(rng: random.Random) -> dict[str, int]:
    """Plausible review counters: an average in 3.2-4.9 over 3-14 reviews."""
    count = rng.randint(3, 14)
    average = rng.uniform(3.2, 4.9)
    return {"rating_count": count, "rating_sum": round(count * average)}


async def _seed_products(
    session: AsyncSession, categories: dict[str, Category], sellers: dict[str, Seller]
) -> tuple[int, int, int]:
    created = 0
    repriced = 0
    photographed = 0
    for category_slug, name, brand, price, stock, certifications, rx, _photo in PRODUCTS:
        slug = slugify(name)
        # Match on the name as well as the slug. A slug is derived from the
        # name, so renaming a product — translating the catalog, say — makes a
        # slug-only check miss the row it already has and seed a duplicate.
        existing = (
            await session.execute(
                select(Product).where((Product.name == name) | (Product.slug == slug))
            )
        ).scalar_one_or_none()
        if existing is not None:
            # Prices are only rewritten when the row is still quoted in another
            # currency — the catalog moved to so'm and those figures are cents.
            # A row already in the right currency keeps whatever dev work put
            # there; this is a re-denomination, not a reset.
            # Backfill photography onto a row that has none. An existing list is
            # left alone: it may hold a seller's own uploads.
            if not existing.images and name in PRODUCT_IMAGES:
                existing.images = list(PRODUCT_IMAGES[name])
                photographed += 1
            if existing.currency != DEFAULT_CURRENCY:
                ratio = price / existing.price_amount_minor if existing.price_amount_minor else 0
                existing.currency = DEFAULT_CURRENCY
                existing.price_amount_minor = price
                if existing.compare_at_amount_minor is not None:
                    existing.compare_at_amount_minor = max(
                        price + 1000,
                        round(existing.compare_at_amount_minor * ratio / 1000) * 1000,
                    )
                repriced += 1
            continue
        seller = _seller_for(brand, sellers)
        # Seeded per product rather than once for the run. A shared stream is
        # only stable while the list is: adding a product shifts every draw
        # after it, and on a re-run the skipped rows consume nothing, so new
        # rows were handed SKUs that existing rows already held.
        rng = random.Random(slug)
        on_sale = rng.random() < 0.34
        # Rounded to the nearest 1 000 so'm so a struck-through price reads
        # like a shelf price rather than an exchange-rate artefact.
        compare_at = round(price * rng.uniform(1.12, 1.45) / 1000) * 1000 if on_sale else None
        product = Product(
            seller_id=seller.id,
            category_id=categories[category_slug].id,
            name=name,
            slug=slug,
            sku=f"{brand[:3].upper()}-{rng.randint(10000, 99999)}",
            brand=brand,
            description=(
                f"{name} — {seller.business_name} tomonidan yetkazib beriladi. "
                f"{seller.country} dan jo‘natiladi; har bir qutida partiya raqami va "
                "yaroqlilik muddati ko‘rsatilgan. Klinika, ish joyi va uyda "
                "ko‘rsatmaga muvofiq foydalanish uchun mos."
            ),
            price_amount_minor=price,
            compare_at_amount_minor=compare_at,
            currency=DEFAULT_CURRENCY,
            stock=stock,
            unit_label="to‘plam" if "dona)" in name else "dona",
            certifications=[c.value for c in certifications],
            prescription_required=rx,
            images=list(PRODUCT_IMAGES.get(name, [])),
            specs={key: rng.choice(values) for key, values in SPEC_POOL.items()},
            status=(
                ProductStatus.ACTIVE
                if seller.status == SellerStatus.VERIFIED
                else ProductStatus.DRAFT
            ),
            # Draw an average first, then derive the sum. Drawing sum and
            # count independently produced averages like 60/4 = 15 on a 1-5
            # scale.
            **_seed_rating(rng),
        )
        session.add(product)
        created += 1
    return created, repriced, photographed


async def main() -> None:
    if settings.is_production:
        raise SystemExit("Refusing to seed a production database.")

    async with SessionLocal() as session:
        users = await _seed_users(session)
        categories = await _seed_categories(session)
        sellers = await _seed_sellers(session, users)
        created, repriced, photographed = await _seed_products(session, categories, sellers)
        await session.commit()

    print(
        f"Seeded {len(categories)} categories, {len(sellers)} sellers, {created} new products, "
        f"{repriced} repriced into {DEFAULT_CURRENCY}, {photographed} photographed.\n"
        f"Dev sign-ins (password: {DEV_PASSWORD}):\n"
        "  admin@medbaza.example    — admin panel\n"
        "  buyer@medbaza.example    — storefront + account\n"
        "  seller1@medbaza.example  — seller dashboard (verified)\n"
        "  seller4@medbaza.example  — seller dashboard (pending verification)"
    )


if __name__ == "__main__":
    asyncio.run(main())
