from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gstr9.models import Gstr9AutoCalculatedRecord, Gstr9DetailsRecord, Gstr9Table8ARecord

from .base_saver import bulk_insert_records, ensure_list, explode_items, get_or_create_client_id, run_persistence


async def save_gstr9_to_db(
    *,
    gstin: str,
    financial_year: str,
    service_response: dict[str, Any],
) -> None:
    async def _work(session: AsyncSession) -> None:
        client_id = await get_or_create_client_id(session, gstin)
        if client_id is None:
            return

        raw_payload = service_response.get("raw") or {}

        table8_rows: list[dict[str, Any]] = []
        for section_name in ("b2b", "b2ba", "cdn"):
            for row in explode_items(ensure_list(service_response.get(section_name))):
                table8_rows.append({
                    **row,
                    "table_code": "8A",
                    "section_code": section_name,
                    "client_id": client_id,
                    "gstin": gstin,
                    "financial_year": financial_year,
                    "raw_payload": raw_payload,
                })
        await bulk_insert_records(session, Gstr9Table8ARecord, table8_rows)

        auto_rows: list[dict[str, Any]] = []
        details_rows: list[dict[str, Any]] = []
        for key, value in service_response.items():
            if key in {"success", "status_cd", "gstin", "raw", "message", "financial_period", "financial_year"}:
                continue
            if isinstance(value, (dict, list)):
                payload_row = {
                    "client_id": client_id,
                    "gstin": gstin,
                    "financial_year": financial_year,
                    "raw_payload": raw_payload,
                    "table_code": key,
                    "record_payload": value,
                }
                if "table8" in key.lower() or "table9" in key.lower() or "table4" in key.lower() or "table5" in key.lower() or "table6" in key.lower():
                    auto_rows.append(payload_row)
                else:
                    details_rows.append(payload_row)

        await bulk_insert_records(session, Gstr9AutoCalculatedRecord, auto_rows)
        await bulk_insert_records(session, Gstr9DetailsRecord, details_rows)

    await run_persistence(_work)
