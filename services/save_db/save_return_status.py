from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gst_return_status.models import GstReturnStatusRecord

from .base_saver import bulk_insert_records, get_or_create_client_id, parse_period_fields, run_persistence


async def save_return_status_to_db(
    *,
    gstin: str,
    year: str,
    month: str,
    reference_id: str,
    service_response: dict[str, Any],
) -> None:
    async def _work(session: AsyncSession) -> None:
        client_id = await get_or_create_client_id(session, gstin)
        if client_id is None:
            return

        parsed_year, parsed_month = parse_period_fields(year, month)
        raw_payload = service_response.get("raw") or {}

        rows = [{
            "client_id": client_id,
            "gstin": gstin,
            "year": parsed_year,
            "month": parsed_month,
            "raw_payload": raw_payload,
            "reference_id": reference_id,
            "status_cd": service_response.get("status_cd"),
            "form_type": service_response.get("form_type"),
            "form_type_label": service_response.get("form_type_label"),
            "action": service_response.get("action"),
            "processing_status": service_response.get("processing_status"),
            "processing_status_label": service_response.get("processing_status_label"),
            "has_errors": service_response.get("has_errors"),
            "error_code": service_response.get("error_code"),
            "error_message": service_response.get("message"),
            "error_report": service_response.get("error_report"),
        }]

        await bulk_insert_records(session, GstReturnStatusRecord, rows)

    await run_persistence(_work)
