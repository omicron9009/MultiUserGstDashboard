from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gstr1.models import (
    Gstr1AdvanceTaxRecord,
    Gstr1B2BRecord,
    Gstr1B2CLRecord,
    Gstr1B2CSARecord,
    Gstr1B2CSRecord,
    Gstr1CDNRRecord,
    Gstr1CDNURRecord,
    Gstr1DocIssueRecord,
    Gstr1EXPRecord,
    Gstr1HSNRecord,
    Gstr1NilRecord,
    Gstr1SummaryRecord,
    Gstr1TXPRecord,
)

from .base_saver import bulk_insert_records, ensure_list, explode_items, get_or_create_client_id, parse_period_fields, run_persistence


_MODEL_BY_ENDPOINT = {
    "GSTR-1 Advance Tax": Gstr1AdvanceTaxRecord,
    "GSTR-1 B2B": Gstr1B2BRecord,
    "GSTR-1 B2CSA": Gstr1B2CSARecord,
    "GSTR-1 B2CS": Gstr1B2CSRecord,
    "GSTR-1 CDNR": Gstr1CDNRRecord,
    "GSTR-1 DOC ISSUE": Gstr1DocIssueRecord,
    "GSTR-1 Document Issued": Gstr1DocIssueRecord,
    "GSTR-1 HSN": Gstr1HSNRecord,
    "GSTR-1 HSN Summary": Gstr1HSNRecord,
    "GSTR-1 NIL": Gstr1NilRecord,
    "GSTR-1 Nil Rated": Gstr1NilRecord,
    "GSTR-1 B2CL": Gstr1B2CLRecord,
    "GSTR-1 CDNUR": Gstr1CDNURRecord,
    "GSTR-1 EXP": Gstr1EXPRecord,
    "GSTR-1 TXP": Gstr1TXPRecord,
}


async def save_gstr1_to_db(
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
        endpoint = (
            (service_response.get("request") or {}).get("endpoint")
            if isinstance(service_response.get("request"), dict)
            else None
        )

        model_cls = _MODEL_BY_ENDPOINT.get(endpoint or "")
        records = explode_items(ensure_list(service_response.get("records")))
        if not records:
            records = explode_items(ensure_list(service_response.get("invoices")))

        if model_cls is not None and records:
            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in records]
            await bulk_insert_records(session, model_cls, rows)

        sections = service_response.get("sections")
        if isinstance(sections, dict):
            summary_rows = [{
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "raw_payload": raw_payload,
                "section_name": section_name,
                "record_payload": section_payload,
            } for section_name, section_payload in sections.items()]
            await bulk_insert_records(session, Gstr1SummaryRecord, summary_rows)

    await run_persistence(_work)
