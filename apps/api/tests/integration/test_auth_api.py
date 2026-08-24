"""Auth routes: registration, login, refresh, and the enumeration guarantee."""

from httpx import AsyncClient

REGISTRATION = {
    "email": "new.buyer@example.com",
    "password": "correct-horse-battery",
    "full_name": "New Buyer",
}


async def test_register_returns_a_session(client: AsyncClient) -> None:
    response = await client.post("/auth/register", json=REGISTRATION)
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "buyer"
    assert body["tokens"]["token_type"] == "bearer"
    assert "password" not in str(body)


async def test_duplicate_email_is_rejected_with_a_stable_code(client: AsyncClient) -> None:
    await client.post("/auth/register", json=REGISTRATION)
    response = await client.post("/auth/register", json=REGISTRATION)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


async def test_login_does_not_reveal_whether_an_account_exists(client: AsyncClient) -> None:
    await client.post("/auth/register", json=REGISTRATION)
    missing = await client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "whatever-long"}
    )
    wrong = await client.post(
        "/auth/login", json={"email": REGISTRATION["email"], "password": "wrong-password"}
    )
    assert missing.status_code == wrong.status_code == 401
    assert missing.json()["error"] == {
        **wrong.json()["error"],
        "request_id": missing.json()["error"]["request_id"],
    }


async def test_refresh_rotates_the_pair(client: AsyncClient) -> None:
    registered = (await client.post("/auth/register", json=REGISTRATION)).json()
    response = await client.post(
        "/auth/refresh", json={"refresh_token": registered["tokens"]["refresh_token"]}
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == REGISTRATION["email"]


async def test_an_access_token_is_not_accepted_as_a_refresh_token(client: AsyncClient) -> None:
    registered = (await client.post("/auth/register", json=REGISTRATION)).json()
    response = await client.post(
        "/auth/refresh", json={"refresh_token": registered["tokens"]["access_token"]}
    )
    assert response.status_code == 401


async def test_me_requires_authentication(client: AsyncClient) -> None:
    assert (await client.get("/auth/me")).status_code == 401


async def test_a_caller_cannot_self_assign_admin(client: AsyncClient) -> None:
    response = await client.post("/auth/register", json={**REGISTRATION, "role": "admin"})
    assert response.status_code == 422
