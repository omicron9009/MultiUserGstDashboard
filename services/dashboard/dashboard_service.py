"""
High-level dashboard service: returns aggregated GST metrics for a given GSTIN.
All queries read ONLY from PostgreSQL — no sandbox API calls.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.client import Client
from database.services.gstr1.models import Gstr1B2BRecord, Gstr1SummaryRecord
from database.services.gstr2a.models import Gstr2AB2BRecord
from database.services.gstr3b.models import Gstr3BDetailsRecord
from database.services.ledger.models import (
    LedgerCashItcBalanceRecord,
    LedgerCashLedgerRecord,
)
from database.services.gst_return_status.models import GstReturnStatusRecord


class DashboardService:
    """Aggregated dashboard metrics from PostgreSQL."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_summary(self, gstin: str, year: Optional[int] = None, month: Optional[int] = None) -> dict[str, Any]:
        """Return top-level dashboard metrics for a GSTIN."""
        filters_b2b = [Gstr1B2BRecord.gstin == gstin]
        filters_2a = [Gstr2AB2BRecord.gstin == gstin]
        filters_3b = [Gstr3BDetailsRecord.gstin == gstin]
        if year:
            filters_b2b.append(Gstr1B2BRecord.year == year)
            filters_2a.append(Gstr2AB2BRecord.year == year)
            filters_3b.append(Gstr3BDetailsRecord.year == year)
        if month:
            filters_b2b.append(Gstr1B2BRecord.month == month)
            filters_2a.append(Gstr2AB2BRecord.month == month)
            filters_3b.append(Gstr3BDetailsRecord.month == month)

        # GSTR1 invoice totals
        gstr1_q = select(
            func.count(Gstr1B2BRecord.id).label("invoice_count"),
            func.coalesce(func.sum(Gstr1B2BRecord.taxable_value), 0).label("total_taxable"),
            func.coalesce(func.sum(Gstr1B2BRecord.igst), 0).label("total_igst"),
            func.coalesce(func.sum(Gstr1B2BRecord.cgst), 0).label("total_cgst"),
            func.coalesce(func.sum(Gstr1B2BRecord.sgst), 0).label("total_sgst"),
        ).where(*filters_b2b)
        gstr1_row = (await self.db.execute(gstr1_q)).one()

        # GSTR2A ITC totals
        gstr2a_q = select(
            func.count(Gstr2AB2BRecord.id).label("invoice_count"),
            func.coalesce(func.sum(Gstr2AB2BRecord.taxable_value), 0).label("total_taxable"),
            func.coalesce(func.sum(Gstr2AB2BRecord.igst), 0).label("total_igst"),
            func.coalesce(func.sum(Gstr2AB2BRecord.cgst), 0).label("total_cgst"),
            func.coalesce(func.sum(Gstr2AB2BRecord.sgst), 0).label("total_sgst"),
        ).where(*filters_2a)
        gstr2a_row = (await self.db.execute(gstr2a_q)).one()

        # GSTR3B liability totals
        gstr3b_q = select(
            func.coalesce(func.sum(Gstr3BDetailsRecord.taxable_value), 0).label("total_taxable"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.igst), 0).label("total_igst"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.cgst), 0).label("total_cgst"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.sgst), 0).label("total_sgst"),
        ).where(*filters_3b)
        gstr3b_row = (await self.db.execute(gstr3b_q)).one()

        # Monthly trend (latest 6 months) for charting
        monthly_q = (
            select(
                Gstr3BDetailsRecord.year.label("year"),
                Gstr3BDetailsRecord.month.label("month"),
                func.coalesce(func.sum(Gstr3BDetailsRecord.igst), 0).label("total_igst"),
                func.coalesce(func.sum(Gstr3BDetailsRecord.cgst), 0).label("total_cgst"),
                func.coalesce(func.sum(Gstr3BDetailsRecord.sgst), 0).label("total_sgst"),
            )
            .where(Gstr3BDetailsRecord.gstin == gstin)
            .group_by(Gstr3BDetailsRecord.year, Gstr3BDetailsRecord.month)
            .order_by(Gstr3BDetailsRecord.year.desc(), Gstr3BDetailsRecord.month.desc())
            .limit(6)
        )
        monthly_rows = (await self.db.execute(monthly_q)).all()
        monthly_trend = [
            {
                "year": row.year,
                "month": row.month,
                "total_igst": float(row.total_igst),
                "total_cgst": float(row.total_cgst),
                "total_sgst": float(row.total_sgst),
            }
            for row in reversed(monthly_rows)
        ]

        return {
            "gstin": gstin,
            "gstr1": {
                "invoice_count": gstr1_row.invoice_count,
                "total_taxable": float(gstr1_row.total_taxable),
                "total_igst": float(gstr1_row.total_igst),
                "total_cgst": float(gstr1_row.total_cgst),
                "total_sgst": float(gstr1_row.total_sgst),
            },
            "gstr2a_itc": {
                "invoice_count": gstr2a_row.invoice_count,
                "total_taxable": float(gstr2a_row.total_taxable),
                "total_igst": float(gstr2a_row.total_igst),
                "total_cgst": float(gstr2a_row.total_cgst),
                "total_sgst": float(gstr2a_row.total_sgst),
            },
            "gstr3b_liability": {
                "total_taxable": float(gstr3b_row.total_taxable),
                "total_igst": float(gstr3b_row.total_igst),
                "total_cgst": float(gstr3b_row.total_cgst),
                "total_sgst": float(gstr3b_row.total_sgst),
            },
            "monthly_tax_trend": monthly_trend,
        }

    async def get_filing_status(self, gstin: str) -> list[dict[str, Any]]:
        """Latest filing status per form type."""
        subq = (
            select(
                GstReturnStatusRecord.form_type,
                func.max(GstReturnStatusRecord.id).label("max_id"),
            )
            .where(GstReturnStatusRecord.gstin == gstin)
            .group_by(GstReturnStatusRecord.form_type)
            .subquery()
        )
        q = select(GstReturnStatusRecord).join(
            subq,
            (GstReturnStatusRecord.form_type == subq.c.form_type)
            & (GstReturnStatusRecord.id == subq.c.max_id),
        )
        rows = (await self.db.execute(q)).scalars().all()
        return [
            {
                "form_type": r.form_type,
                "form_type_label": r.form_type_label,
                "status_cd": r.status_cd,
                "action": r.action,
                "processing_status": r.processing_status,
                "processing_status_label": r.processing_status_label,
                "has_errors": r.has_errors,
                "error_code": r.error_code,
                "error_message": r.error_message,
                "year": r.year,
                "month": r.month,
            }
            for r in rows
        ]
