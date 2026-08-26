"""Catalog photo storage: key shape, URL resolution, and the public/private split."""

import pytest

from app.core.config import settings
from app.storage import images
from app.storage.base import StorageError


def test_a_key_carries_no_user_supplied_filename() -> None:
    key = images.build_key("01a0329f-85cd-7a96-a55b-881aed0a6e54", "image/png")
    assert key.startswith("products/01a0329f-85cd-7a96-a55b-881aed0a6e54/")
    assert key.endswith(".png")
    assert images.is_managed_key(key)


def test_two_uploads_never_collide() -> None:
    product = "01a0329f-85cd-7a96-a55b-881aed0a6e54"
    assert images.build_key(product, "image/jpeg") != images.build_key(product, "image/jpeg")


@pytest.mark.parametrize("content_type", ["image/svg+xml", "application/pdf", "text/html", ""])
def test_only_photo_formats_get_a_key(content_type: str) -> None:
    # SVG is excluded on purpose: it is a script-bearing document, not a photo.
    with pytest.raises(StorageError):
        images.build_key("01a0329f-85cd-7a96-a55b-881aed0a6e54", content_type)


def test_seeded_paths_and_absolute_urls_pass_through_untouched() -> None:
    # The seed writes web-app asset paths; those are not bucket keys.
    assert images.resolve_url("/products/clogs-black.jpg") == "/products/clogs-black.jpg"
    assert images.resolve_url("https://cdn.example/x.png") == "https://cdn.example/x.png"


def test_a_bucket_key_is_resolved_against_the_public_base(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "image_public_base_url", "https://pub-abc.r2.dev/")
    key = "products/01a0329f-85cd-7a96-a55b-881aed0a6e54/" + "a" * 32 + ".webp"
    # The trailing slash on the base must not double up.
    assert images.resolve_url(key) == f"https://pub-abc.r2.dev/{key}"


def test_traversal_is_not_a_managed_key() -> None:
    assert not images.is_managed_key("../../etc/passwd")
    assert not images.is_managed_key("prescriptions/secret.pdf")
    assert not images.is_managed_key("products/x/y.exe")
    with pytest.raises(StorageError):
        images.local_path_for("../../etc/passwd")


def test_the_image_bucket_is_not_the_document_bucket() -> None:
    # Prescriptions are encrypted and private; catalog photos are public. One
    # bucket for both would either leak health documents or make the catalog
    # uncacheable (CLAUDE.md §5.5, §12.2).
    assert settings.image_bucket != settings.storage_bucket
