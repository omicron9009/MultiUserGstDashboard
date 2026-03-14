from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from database.services.ledger.models import (
    LedgerCashItcBalanceRecord,
    LedgerCashLedgerRecord,
    LedgerItcLedgerRecord,
    LedgerReturnLiabilityLedgerRecord,
)

from .base_saver import bulk_insert_records, ensure_list, get_or_create_client_id, parse_period_fields, run_persistence


def _flatten_balance(snapshot_type: str, block: Any) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not isinstance(block, dict):
        return rows
    for tax_head, values in block.items():
        if isinstance(values, dict):
            for component, amount in values.items():
                rows.append({
                    "snapshot_type": snapshot_type,
                    "tax_head": str(tax_head),
                    "component": str(component),
                    "amount": amount,
                })
    return rows


async def save_ledger_to_db(
    *,
    gstin: str,
    year: str | None,
    month: str | None,
    from_date: str | None,
    to_date: str | None,
    service_response: dict[str, Any],
) -> None:
    async def _work(session: AsyncSession) -> None:
        client_id = await get_or_create_client_id(session, gstin)
        if client_id is None:
            return

        parsed_year, parsed_month = parse_period_fields(year, month)
        raw_payload = service_response.get("raw") or {}

        balance_rows = []
        balance_rows.extend(_flatten_balance("cash_balance", service_response.get("cash_balance")))
        balance_rows.extend(_flatten_balance("itc_balance", service_response.get("itc_balance")))
        balance_rows.extend(_flatten_balance("itc_blocked_balance", service_response.get("itc_blocked_balance")))
        if balance_rows:
            rows = [{
                **row,
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "raw_payload": raw_payload,
            } for row in balance_rows]
            await bulk_insert_records(session, LedgerCashItcBalanceRecord, rows)

        transactions = ensure_list(service_response.get("transactions"))
        if transactions:
            cash_rows = [{
                **row,
                "entry_type": "transaction",
                "client_id": client_id,
                "gstin": gstin,
                "from_date": from_date,
                "to_date": to_date,
                "raw_payload": raw_payload,
                "record_payload": row,
            } for row in transactions]
            await bulk_insert_records(session, LedgerCashLedgerRecord, cash_rows)

            itc_rows = [{
                **row,
                "entry_type": "transaction",
                "client_id": client_id,
                "gstin": gstin,
                "from_date": from_date,
                "to_date": to_date,
                "raw_payload": raw_payload,
                "record_payload": row,
            } for row in transactions]
            await bulk_insert_records(session, LedgerItcLedgerRecord, itc_rows)

            liability_rows = [{
                **row,
                "entry_type": "transaction",
                "client_id": client_id,
                "gstin": gstin,
                "year": parsed_year,
                "month": parsed_month,
                "from_date": from_date,
                "to_date": to_date,
                "raw_payload": raw_payload,
                "record_payload": row,
            } for row in transactions]
            await bulk_insert_records(session, LedgerReturnLiabilityLedgerRecord, liability_rows)

    await run_persistence(_work)
