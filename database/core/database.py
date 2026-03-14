from __future__ import annotations

import logging
import os
import re
from collections.abc import AsyncGenerator

import asyncpg
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from .config import settings


logger = logging.getLogger(__name__)


engine: AsyncEngine = create_async_engine(
    settings.database_url,
    echo=settings.echo_sql,
    future=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def ensure_database_exists() -> None:
    """
    Create the target PostgreSQL database if it does not exist.
    Safe no-op for non-PostgreSQL URLs.
    """
    db_url = settings.database_url
    if not db_url.startswith("postgresql"):
        return

    try:
        url = make_url(db_url)
    except Exception as exc:
        logger.warning("Skipping database auto-create: invalid DATABASE_URL. error=%s", exc)
        return

    db_name = url.database
    if not db_name:
        logger.warning("Skipping database auto-create: database name missing in DATABASE_URL")
        return

    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", db_name):
        logger.warning("Skipping database auto-create: unsupported database name '%s'", db_name)
        return

    # If target DB is already reachable, nothing else to do.
    try:
        conn = await asyncpg.connect(
            user=url.username,
            password=url.password,
            host=url.host or "127.0.0.1",
            port=url.port or 5432,
            database=db_name,
        )
        await conn.close()
        return
    except asyncpg.InvalidCatalogNameError:
        # Expected when DB is missing; fall through to create it from admin DB.
        pass
    except Exception as exc:
        logger.warning(
            "Skipping database auto-create: cannot connect to target DB '%s'. error=%s",
            db_name,
            exc,
        )
        return

    admin_db = os.getenv("DATABASE_ADMIN_DB", "postgres")
    try:
        admin_conn = await asyncpg.connect(
            user=url.username,
            password=url.password,
            host=url.host or "127.0.0.1",
            port=url.port or 5432,
            database=admin_db,
        )
        await admin_conn.execute(f'CREATE DATABASE "{db_name}"')
        await admin_conn.close()
        logger.info("Created database '%s'", db_name)
    except asyncpg.DuplicateDatabaseError:
        logger.info("Database '%s' already exists", db_name)
    except Exception as exc:
        logger.warning("Failed to auto-create database '%s'. error=%s", db_name, exc)

