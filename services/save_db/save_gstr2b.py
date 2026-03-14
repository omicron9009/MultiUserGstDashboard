from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gstr2b.models import Gstr2BRecord, Gstr2BRegenerationStatusRecord

from .base_saver import bulk_insert_records, ensure_list, explode_items, get_or_create_client_id, parse_period_fields, run_persistence


async def save_gstr2b_to_db(
    *,
    gstin: str,
    year: str | None,
    month: str | None,
    service_response: dict[str, Any],
) -> None:
    def _extract_document_rows(response: dict[str, Any]) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []

        section_map = {
            "b2b": "invoices",
            "b2ba": "invoices",
            "cdnr": "notes",
            "cdnra": "notes",
            "isd": "entries",
        }

        for section, key in section_map.items():
            section_block = response.get(section)
            if isinstance(section_block, dict):
                records = ensure_list(section_block.get(key))
                for record in explode_items(records):
                    rows.append({**record, "section": section})

        return rows

    async def _work(session: AsyncSession) -> None:
        client_id = await get_or_create_client_id(session, gstin)
        if client_id is None:
            return

        parsed_year, parsed_month = parse_period_fields(year, month)
        raw_payload = service_response.get("raw") or {}

        rows: list[dict[str, Any]] = []
        for record in _extract_document_rows(service_response):
            rows.append({
                **record,
                "section": record.get("section"),
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "raw_payload": raw_payload,
                "record_payload": record,
                "status_cd": service_response.get("status_cd"),
                "response_type": service_response.get("response_type"),
                "file_count": service_response.get("file_count"),
                "file_number": service_response.get("file_number"),
            })

        await bulk_insert_records(session, Gstr2BRecord, rows)

        reference_id = service_response.get("reference_id")
        if reference_id:
            regen_rows = [{
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "raw_payload": raw_payload,
                "reference_id": reference_id,
                "regeneration_status": service_response.get("regeneration_status"),
                "regeneration_status_label": service_response.get("regeneration_status_label"),
                "error_code": service_response.get("error_code"),
                "error_message": service_response.get("message") or service_response.get("error_message"),
            }]
            await bulk_insert_records(session, Gstr2BRegenerationStatusRecord, regen_rows)

    await run_persistence(_work)
