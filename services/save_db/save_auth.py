from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.session import GstSession

from .base_saver import get_or_create_client_id, run_persistence


def _as_datetime(value: Any) -> Optional[datetime]:
    if value in (None, ""):
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, (int, float)):
        ts = float(value)
        if ts > 1_000_000_000_000:
            ts = ts / 1000.0
        return datetime.fromtimestamp(ts)

    if not isinstance(value, str):
        return None

    raw = value.strip()
    if not raw:
        return None

    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


async def save_auth_session_to_db(
    *,
    gstin: str,
    username: Optional[str],
    access_token: Optional[str],
    refresh_token: Optional[str],
    token_expiry: Any,
    session_expiry: Any,
    last_refresh: Any,
) -> None:
    if not access_token:
        return

    async def _work(session: AsyncSession) -> None:
        client_id = await get_or_create_client_id(session, gstin)
        if client_id is None:
            return

        existing = await session.execute(
            select(GstSession)
            .where(GstSession.client_id == client_id)
            .order_by(GstSession.id.desc())
            .limit(1)
        )
        row = existing.scalar_one_or_none()

        if row is None:
            row = GstSession(
                client_id=client_id,
                access_token=access_token,
                refresh_token=refresh_token,
                username=username,
                token_expiry=_as_datetime(token_expiry),
                session_expiry=_as_datetime(session_expiry),
                last_refresh=_as_datetime(last_refresh),
            )
            session.add(row)
            return

        row.access_token = access_token
        row.refresh_token = refresh_token
        row.username = username
        row.token_expiry = _as_datetime(token_expiry)
        row.session_expiry = _as_datetime(session_expiry)
        row.last_refresh = _as_datetime(last_refresh)

    await run_persistence(_work)
