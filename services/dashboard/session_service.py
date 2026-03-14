"""
Session status service: active sessions, expiry, last refresh.
Reads ONLY from gst_sessions table in PostgreSQL.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.client import Client
from database.models.session import GstSession


class SessionService:
    """Read-only queries on GST sessions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_sessions(self, gstin: Optional[str] = None) -> list[dict[str, Any]]:
        """Return all active (non-expired) sessions, optionally filtered by GSTIN."""
        now = datetime.now(timezone.utc)
        q = (
            select(GstSession, Client.gstin, Client.legal_name)
            .join(Client, GstSession.client_id == Client.id)
            .where(
                (GstSession.session_expiry.is_(None)) | (GstSession.session_expiry > now)
            )
        )
        if gstin:
            q = q.where(Client.gstin == gstin)

        rows = (await self.db.execute(q)).all()
        return [
            {
                "session_id": session.id,
                "client_id": session.client_id,
                "gstin": client_gstin,
                "legal_name": legal_name,
                "username": session.username,
                "session_expiry": session.session_expiry.isoformat() if session.session_expiry else None,
                "last_refresh": session.last_refresh.isoformat() if session.last_refresh else None,
                "created_at": session.created_at.isoformat() if session.created_at else None,
            }
            for session, client_gstin, legal_name in rows
        ]

    async def get_session_expiry(self, gstin: str) -> Optional[dict[str, Any]]:
        """Return the latest session expiry for a GSTIN."""
        q = (
            select(GstSession)
            .join(Client, GstSession.client_id == Client.id)
            .where(Client.gstin == gstin)
            .order_by(GstSession.id.desc())
            .limit(1)
        )
        session = (await self.db.execute(q)).scalar_one_or_none()
        if not session:
            return None
        return {
            "session_id": session.id,
            "session_expiry": session.session_expiry.isoformat() if session.session_expiry else None,
            "token_expiry": session.token_expiry.isoformat() if session.token_expiry else None,
        }

    async def get_last_refresh(self, gstin: str) -> Optional[dict[str, Any]]:
        """Return the last refresh timestamp for a GSTIN."""
        q = (
            select(GstSession)
            .join(Client, GstSession.client_id == Client.id)
            .where(Client.gstin == gstin)
            .order_by(GstSession.last_refresh.desc().nulls_last())
            .limit(1)
        )
        session = (await self.db.execute(q)).scalar_one_or_none()
        if not session:
            return None
        return {
            "session_id": session.id,
            "last_refresh": session.last_refresh.isoformat() if session.last_refresh else None,
        }
