"""
Dashboard router: read-only endpoints that query ONLY PostgreSQL.
No sandbox GST API calls are made from these endpoints.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database.core.database import get_db
from services.dashboard.dashboard_service import DashboardService
from services.dashboard.summary_service import SummaryService
from services.dashboard.gst_analytics_service import GstAnalyticsService
from services.dashboard.session_service import SessionService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/clients")
async def dashboard_clients(
    db: AsyncSession = Depends(get_db),
):
    """List all configured clients with their latest session metadata."""
    svc = SessionService(db)
    clients = await svc.get_clients_overview()
    return {"clients": clients, "total": len(clients)}


@router.get("/summary/{gstin}")
async def dashboard_summary(
    gstin: str,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated GST metrics + filing status for a GSTIN."""
    svc = DashboardService(db)
    summary = await svc.get_summary(gstin, year, month)
    filing_status = await svc.get_filing_status(gstin)
    return {"summary": summary, "filing_status": filing_status}


@router.get("/ledger/{gstin}")
async def dashboard_ledger(
    gstin: str,
    db: AsyncSession = Depends(get_db),
):
    """Ledger analytics: balances, monthly totals, transaction counts."""
    svc = GstAnalyticsService(db)
    return await svc.get_ledger_analytics(gstin)


@router.get("/returns/{gstin}")
async def dashboard_returns(
    gstin: str,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return summaries for GSTR1, GSTR2B, GSTR3B."""
    svc = SummaryService(db)
    return await svc.get_return_summaries(gstin, year, month)


@router.get("/session/{gstin}")
async def dashboard_session(
    gstin: str,
    db: AsyncSession = Depends(get_db),
):
    """Session status: active sessions, expiry, last refresh."""
    svc = SessionService(db)
    active = await svc.get_active_sessions(gstin)
    expiry = await svc.get_session_expiry(gstin)
    last_refresh = await svc.get_last_refresh(gstin)
    return {
        "active_sessions": active,
        "active_count": len(active),
        "expiry": expiry,
        "last_refresh": last_refresh,
    }
