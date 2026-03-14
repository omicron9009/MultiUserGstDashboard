from __future__ import annotations

import os
from dataclasses import dataclass


def _read_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True, slots=True)
class DatabaseSettings:
    database_url: str
    echo_sql: bool = False


def get_database_settings() -> DatabaseSettings:
    database_url = "postgresql+asyncpg://postgres:root@localhost:5432/gst_platform"
    return DatabaseSettings(
        database_url=database_url,
        echo_sql=_read_bool("DATABASE_ECHO", default=False),
    )


settings = get_database_settings()
