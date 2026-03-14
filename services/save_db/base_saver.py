from __future__ import annotations

import logging
import time
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Optional, Sequence, TypeVar

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from database.core.database import AsyncSessionLocal
from database.models.client import Client


logger = logging.getLogger(__name__)
ModelT = TypeVar("ModelT")
_LAST_DB_UNAVAILABLE_LOG_EPOCH = 0.0
_DB_UNAVAILABLE_LOG_COOLDOWN_SECONDS = 60


def as_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def as_decimal(value: Any) -> Optional[Decimal]:
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def as_date(value: Any) -> Optional[date]:
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if not isinstance(value, str):
        return None

    raw = value.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def ensure_list(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    return []


def explode_items(rows: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for row in rows:
        items = row.get("items")
        if isinstance(items, list) and items:
            parent = {k: v for k, v in row.items() if k != "items"}
            for item in items:
                if isinstance(item, dict):
                    out.append({**parent, **item})
        else:
            out.append(dict(row))
    return out


def _coerce_value_for_column(value: Any, column: Any) -> Any:
    py_type = None
    try:
        py_type = column.type.python_type
    except Exception:
        py_type = None

    if value is None:
        return None

    if py_type is int:
        return as_int(value)
    if py_type is Decimal:
        return as_decimal(value)
    if py_type is date:
        return as_date(value)
    if py_type is bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "t", "1", "yes", "y"}:
                return True
            if lowered in {"false", "f", "0", "no", "n"}:
                return False
        return bool(value)

    return value


def model_kwargs(model_cls: type[ModelT], payload: dict[str, Any]) -> dict[str, Any]:
    kwargs: dict[str, Any] = {}
    for column in model_cls.__table__.columns:
        if column.name in payload:
            kwargs[column.name] = _coerce_value_for_column(payload.get(column.name), column)
    return kwargs


async def get_or_create_client_id(session: AsyncSession, gstin: str) -> Optional[int]:
    normalized = (gstin or "").strip()
    if not normalized:
        return None

    result = await session.execute(select(Client).where(Client.gstin == normalized))
    client = result.scalar_one_or_none()
    if client is not None:
        return client.id

    client = Client(gstin=normalized)
    session.add(client)
    await session.flush()
    return client.id


async def bulk_insert_records(
    session: AsyncSession,
    model_cls: type[ModelT],
    rows: Sequence[dict[str, Any]],
) -> int:
    instances = []
    for row in rows:
        kwargs = model_kwargs(model_cls, row)
        if kwargs:
            instances.append(model_cls(**kwargs))

    if not instances:
        return 0

    session.add_all(instances)
    return len(instances)


def parse_period_fields(year: Optional[str], month: Optional[str]) -> tuple[Optional[int], Optional[int]]:
    return as_int(year), as_int(month)


async def run_persistence(work: Any) -> None:
    global _LAST_DB_UNAVAILABLE_LOG_EPOCH

    try:
        async with AsyncSessionLocal() as session:
            await work(session)
            await session.commit()
    except Exception as exc:
        # Keep API responses non-blocking when DB is unreachable/misconfigured.
        is_connectivity_issue = isinstance(exc, (OSError, ConnectionError, TimeoutError, SQLAlchemyError))
        if is_connectivity_issue:
            now = time.time()
            if (now - _LAST_DB_UNAVAILABLE_LOG_EPOCH) >= _DB_UNAVAILABLE_LOG_COOLDOWN_SECONDS:
                _LAST_DB_UNAVAILABLE_LOG_EPOCH = now
                logger.warning(
                    "DB persistence skipped: database unavailable. "
                    "Check DATABASE_URL and ensure PostgreSQL is running. error=%s",
                    exc,
                )
            return

        logger.exception("DB persistence failed")
