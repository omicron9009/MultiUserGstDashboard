"""
Summary service: aggregated return totals for dashboard cards.
Reads ONLY from PostgreSQL.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gstr1.models import Gstr1SummaryRecord
from database.services.gstr2b.models import Gstr2BRecord
from database.services.gstr3b.models import Gstr3BDetailsRecord


class SummaryService:
    """Return summary aggregations for dashboard cards."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_return_summaries(
        self, gstin: str, year: Optional[int] = None, month: Optional[int] = None
    ) -> dict[str, Any]:
        """Aggregated totals from gstr1_summary, gstr2b, gstr3b_details."""

        # GSTR1 summary records
        gstr1_filters = [Gstr1SummaryRecord.gstin == gstin]
        if year:
            gstr1_filters.append(Gstr1SummaryRecord.year == year)
        if month:
            gstr1_filters.append(Gstr1SummaryRecord.month == month)

        gstr1_q = select(
            func.count(Gstr1SummaryRecord.id).label("record_count"),
        ).where(*gstr1_filters)
        gstr1_row = (await self.db.execute(gstr1_q)).one()

        # GSTR2B records
        gstr2b_filters = [Gstr2BRecord.gstin == gstin]
        if year:
            gstr2b_filters.append(Gstr2BRecord.year == year)
        if month:
            gstr2b_filters.append(Gstr2BRecord.month == month)

        gstr2b_q = select(
            func.count(Gstr2BRecord.id).label("record_count"),
            func.coalesce(func.sum(Gstr2BRecord.taxable_value), 0).label("total_taxable"),
            func.coalesce(func.sum(Gstr2BRecord.igst), 0).label("total_igst"),
            func.coalesce(func.sum(Gstr2BRecord.cgst), 0).label("total_cgst"),
            func.coalesce(func.sum(Gstr2BRecord.sgst), 0).label("total_sgst"),
            func.coalesce(func.sum(Gstr2BRecord.cess), 0).label("total_cess"),
        ).where(*gstr2b_filters)
        gstr2b_row = (await self.db.execute(gstr2b_q)).one()

        # GSTR3B details
        gstr3b_filters = [Gstr3BDetailsRecord.gstin == gstin]
        if year:
            gstr3b_filters.append(Gstr3BDetailsRecord.year == year)
        if month:
            gstr3b_filters.append(Gstr3BDetailsRecord.month == month)

        gstr3b_q = select(
            func.count(Gstr3BDetailsRecord.id).label("record_count"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.taxable_value), 0).label("total_taxable"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.igst), 0).label("total_igst"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.cgst), 0).label("total_cgst"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.sgst), 0).label("total_sgst"),
            func.coalesce(func.sum(Gstr3BDetailsRecord.cess), 0).label("total_cess"),
        ).where(*gstr3b_filters)
        gstr3b_row = (await self.db.execute(gstr3b_q)).one()

        return {
            "gstin": gstin,
            "gstr1_summary": {
                "record_count": gstr1_row.record_count,
            },
            "gstr2b": {
                "record_count": gstr2b_row.record_count,
                "total_taxable": float(gstr2b_row.total_taxable),
                "total_igst": float(gstr2b_row.total_igst),
                "total_cgst": float(gstr2b_row.total_cgst),
                "total_sgst": float(gstr2b_row.total_sgst),
                "total_cess": float(gstr2b_row.total_cess),
            },
            "gstr3b": {
                "record_count": gstr3b_row.record_count,
                "total_taxable": float(gstr3b_row.total_taxable),
                "total_igst": float(gstr3b_row.total_igst),
                "total_cgst": float(gstr3b_row.total_cgst),
                "total_sgst": float(gstr3b_row.total_sgst),
                "total_cess": float(gstr3b_row.total_cess),
            },
        }
