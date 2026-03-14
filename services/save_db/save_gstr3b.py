from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gstr3b.models import Gstr3BAutoLiabilityRecord, Gstr3BDetailsRecord

from .base_saver import bulk_insert_records, get_or_create_client_id, parse_period_fields, run_persistence


async def save_gstr3b_to_db(
    *,
    gstin: str,
    year: str,
    month: str,
    service_response: dict[str, Any],
) -> None:
    async def _work(session: AsyncSession) -> None:
        client_id = await get_or_create_client_id(session, gstin)
        if client_id is None:
            return

        parsed_year, parsed_month = parse_period_fields(year, month)
        raw_payload = service_response.get("raw") or {}

        detail_rows: list[dict[str, Any]] = []
        for key, value in service_response.items():
            if key in {"success", "status_cd", "gstin", "raw", "message", "request", "upstream_status_code"}:
                continue
            if isinstance(value, (dict, list)):
                detail_rows.append({
                    "client_id": client_id,
                    "gstin": gstin,
                    "year": parsed_year,
                    "month": parsed_month,
                    "raw_payload": raw_payload,
                    "section": key,
                    "record_payload": value,
                })

        await bulk_insert_records(session, Gstr3BDetailsRecord, detail_rows)

        auto_liability = service_response.get("auto_liability")
        if isinstance(auto_liability, (dict, list)):
            auto_rows = [{
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "raw_payload": raw_payload,
                "section": "auto_liability",
                "record_payload": auto_liability,
            }]
            await bulk_insert_records(session, Gstr3BAutoLiabilityRecord, auto_rows)

    await run_persistence(_work)
