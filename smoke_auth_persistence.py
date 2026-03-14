from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import select

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./smoke_auth.db")

import services.auth as auth_module
from database.models.client import Client
from database.models.session import GstSession
from database.core.database import AsyncSessionLocal, engine
from main import app


class DummyResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self):
        return self._payload


def _iso_epoch_hours(hours: int) -> int:
    return int((datetime.now(tz=timezone.utc).timestamp() + hours * 3600) * 1000)


def fake_post(url, json=None, headers=None, timeout=30):
    # OTP generate
    if url.endswith("/gst/compliance/tax-payer/otp"):
        return DummyResponse(
            200,
            {
                "status_cd": "1",
                "message": "OTP sent",
            },
        )

    # OTP verify
    if "/gst/compliance/tax-payer/otp/verify" in url:
        return DummyResponse(
            200,
            {
                "status_cd": "1",
                "message": "OTP verified",
                "data": {
                    "access_token": "token_verify_abc",
                    "refresh_token": "refresh_verify_abc",
                    "token_expiry": _iso_epoch_hours(6),
                    "session_expiry": _iso_epoch_hours(24),
                },
            },
        )

    # Session refresh
    if url.endswith("/gst/compliance/tax-payer/session/refresh"):
        return DummyResponse(
            200,
            {
                "status_cd": "1",
                "message": "Session refreshed",
                "data": {
                    "access_token": "token_refresh_xyz",
                    "refresh_token": "refresh_refresh_xyz",
                    "token_expiry": _iso_epoch_hours(6),
                    "session_expiry": _iso_epoch_hours(24),
                },
            },
        )

    # Platform authenticate
    if url.endswith("/authenticate"):
        # Valid-like JWT shape for decoder path (exp included in middle part is skipped by fallback if malformed)
        return DummyResponse(
            200,
            {"data": {"access_token": "a.b.c"}},
        )

    return DummyResponse(404, {"status_cd": "0", "message": "Unhandled URL in fake_post"})


async def ensure_session_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Client.__table__.create, checkfirst=True)
        await conn.run_sync(GstSession.__table__.create, checkfirst=True)


async def fetch_latest_session(gstin: str):
    async with AsyncSessionLocal() as session:
        client_result = await session.execute(select(Client).where(Client.gstin == gstin))
        client = client_result.scalar_one_or_none()
        if client is None:
            return None

        session_result = await session.execute(
            select(GstSession)
            .where(GstSession.client_id == client.id)
            .order_by(GstSession.id.desc())
            .limit(1)
        )
        row = session_result.scalar_one_or_none()
        if row is None:
            return None

        return {
            "client_id": row.client_id,
            "access_token": row.access_token,
            "refresh_token": row.refresh_token,
            "username": row.username,
            "token_expiry": row.token_expiry.isoformat() if row.token_expiry else None,
            "session_expiry": row.session_expiry.isoformat() if row.session_expiry else None,
            "last_refresh": row.last_refresh.isoformat() if row.last_refresh else None,
        }


def main():
    gstin = "27AABFP2335E1ZM"
    username = "Pgjcoca_1"

    asyncio.run(ensure_session_tables())

    original_post = auth_module.requests.post
    auth_module.requests.post = fake_post
    try:
        client = TestClient(app)

        r1 = client.post("/auth/generate-otp", json={"username": username, "gstin": gstin})
        print("generate-otp:", r1.status_code, r1.json().get("success"), r1.json().get("message"))

        r2 = client.post("/auth/verify-otp", json={"username": username, "gstin": gstin, "otp": "123456"})
        print("verify-otp:", r2.status_code, r2.json().get("success"), r2.json().get("message"))

        after_verify = asyncio.run(fetch_latest_session(gstin))
        print("db_after_verify:", after_verify)

        r3 = client.post("/auth/refresh", json={"gstin": gstin})
        print("refresh:", r3.status_code, r3.json().get("success"), r3.json().get("message"))

        after_refresh = asyncio.run(fetch_latest_session(gstin))
        print("db_after_refresh:", after_refresh)

    finally:
        auth_module.requests.post = original_post


if __name__ == "__main__":
    main()
