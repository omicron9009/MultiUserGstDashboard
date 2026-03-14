"""
Ledger analytics service: balances, monthly totals, transaction counts.
Reads ONLY from PostgreSQL.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.services.ledger.models import (
    LedgerCashItcBalanceRecord,
    LedgerCashLedgerRecord,
    LedgerItcLedgerRecord,
    LedgerReturnLiabilityLedgerRecord,
)


class GstAnalyticsService:
    """Ledger analytics queries from PostgreSQL."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_ledger_analytics(self, gstin: str) -> dict[str, Any]:
        """Cash ledger, ITC ledger and liability ledger analytics."""

        # Cash ledger summary
        cash_q = select(
            func.count(LedgerCashLedgerRecord.id).label("transaction_count"),
            func.min(LedgerCashLedgerRecord.amount).label("min_amount"),
            func.max(LedgerCashLedgerRecord.amount).label("max_amount"),
            func.coalesce(func.sum(LedgerCashLedgerRecord.amount), 0).label("total_amount"),
        ).where(LedgerCashLedgerRecord.gstin == gstin)
        cash_row = (await self.db.execute(cash_q)).one()

        # ITC ledger summary
        itc_q = select(
            func.count(LedgerItcLedgerRecord.id).label("transaction_count"),
            func.coalesce(func.sum(LedgerItcLedgerRecord.amount), 0).label("total_amount"),
        ).where(LedgerItcLedgerRecord.gstin == gstin)
        itc_row = (await self.db.execute(itc_q)).one()

        # Liability ledger summary
        liability_q = select(
            func.count(LedgerReturnLiabilityLedgerRecord.id).label("transaction_count"),
            func.coalesce(func.sum(LedgerReturnLiabilityLedgerRecord.amount), 0).label("total_amount"),
        ).where(LedgerReturnLiabilityLedgerRecord.gstin == gstin)
        liability_row = (await self.db.execute(liability_q)).one()

        # Cash/ITC balance snapshot
        balance_q = select(
            LedgerCashItcBalanceRecord.snapshot_type,
            LedgerCashItcBalanceRecord.tax_head,
            LedgerCashItcBalanceRecord.component,
            LedgerCashItcBalanceRecord.amount,
        ).where(LedgerCashItcBalanceRecord.gstin == gstin).order_by(
            LedgerCashItcBalanceRecord.id.desc()
        )
        balance_rows = (await self.db.execute(balance_q)).all()
        balances = [
            {
                "snapshot_type": r.snapshot_type,
                "tax_head": r.tax_head,
                "component": r.component,
                "amount": float(r.amount) if r.amount else 0,
            }
            for r in balance_rows
        ]

        # Monthly cash totals
        monthly_q = (
            select(
                LedgerCashLedgerRecord.from_date,
                func.count(LedgerCashLedgerRecord.id).label("count"),
                func.coalesce(func.sum(LedgerCashLedgerRecord.amount), 0).label("total"),
            )
            .where(LedgerCashLedgerRecord.gstin == gstin)
            .group_by(LedgerCashLedgerRecord.from_date)
            .order_by(LedgerCashLedgerRecord.from_date)
        )
        monthly_rows = (await self.db.execute(monthly_q)).all()
        monthly_totals = [
            {
                "from_date": str(r.from_date) if r.from_date else None,
                "transaction_count": r.count,
                "total_amount": float(r.total),
            }
            for r in monthly_rows
        ]

        return {
            "gstin": gstin,
            "cash_ledger": {
                "transaction_count": cash_row.transaction_count,
                "total_amount": float(cash_row.total_amount),
                "min_amount": float(cash_row.min_amount) if cash_row.min_amount else None,
                "max_amount": float(cash_row.max_amount) if cash_row.max_amount else None,
            },
            "itc_ledger": {
                "transaction_count": itc_row.transaction_count,
                "total_amount": float(itc_row.total_amount),
            },
            "liability_ledger": {
                "transaction_count": liability_row.transaction_count,
                "total_amount": float(liability_row.total_amount),
            },
            "balances": balances,
            "monthly_totals": monthly_totals,
        }
