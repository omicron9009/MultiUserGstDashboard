from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.gstr2a.models import (
    Gstr2AB2BARecord,
    Gstr2AB2BRecord,
    Gstr2ACDNARecord,
    Gstr2ACDNRecord,
    Gstr2ADocumentRecord,
    Gstr2AISDRecord,
    Gstr2ATDSRecord,
)

from .base_saver import bulk_insert_records, ensure_list, explode_items, get_or_create_client_id, parse_period_fields, run_persistence


async def save_gstr2a_to_db(
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

        records = explode_items(ensure_list(service_response.get("records")))
        if endpoint == "GSTR-2A B2B":
            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in records]
            await bulk_insert_records(session, Gstr2AB2BRecord, rows)
        elif endpoint == "GSTR-2A B2BA":
            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in records]
            await bulk_insert_records(session, Gstr2AB2BARecord, rows)
        elif endpoint == "GSTR-2A CDN":
            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in records]
            await bulk_insert_records(session, Gstr2ACDNRecord, rows)
        elif endpoint == "GSTR-2A CDNA":
            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in records]
            await bulk_insert_records(session, Gstr2ACDNARecord, rows)
        elif endpoint == "GSTR-2A ISD":
            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in records]
            await bulk_insert_records(session, Gstr2AISDRecord, rows)

        tds_records = ensure_list(service_response.get("tds"))
        if tds_records:
            rows = [{
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "raw_payload": raw_payload,
                "deductor_name": r.get("deductor_name"),
                "deductor_gstin": r.get("deductor_gstin"),
                "recipient_gstin": r.get("recipient_gstin"),
                "return_period": r.get("return_period"),
                "deduction_base_amount": r.get("deduction_base_amount"),
                "igst": (r.get("tds_credit") or {}).get("igst"),
                "cgst": (r.get("tds_credit") or {}).get("cgst"),
                "sgst": (r.get("tds_credit") or {}).get("sgst"),
            } for r in tds_records]
            await bulk_insert_records(session, Gstr2ATDSRecord, rows)

        for section_name, model_cls in (("b2b", Gstr2AB2BRecord), ("b2ba", Gstr2AB2BARecord), ("cdn", Gstr2ACDNRecord)):
            section_rows = explode_items(ensure_list(service_response.get(section_name)))
            if not section_rows:
                continue

            rows = [{**row, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in section_rows]
            await bulk_insert_records(session, model_cls, rows)

            document_rows = [{**row, "section": section_name, "client_id": client_id, "gstin": gstin, "year": parsed_year, "month": parsed_month, "raw_payload": raw_payload} for row in section_rows]
            await bulk_insert_records(session, Gstr2ADocumentRecord, document_rows)

    await run_persistence(_work)
