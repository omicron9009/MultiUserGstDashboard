"""
Create all ORM-defined tables in PostgreSQL if they do not already exist.

Usage:
    from database.init_schema import create_all_tables
    await create_all_tables()

This module force-imports every model package so that all 34 tables
are registered on ``Base.metadata`` before ``create_all`` runs.
"""
from __future__ import annotations

import logging

from .core.base import Base
from .core.database import engine

# ── Force-import every model so Base.metadata knows about all tables ──
from .models import Client, GstSession  # noqa: F401
from .services.gstr1.models import (  # noqa: F401
    Gstr1AdvanceTaxRecord,
    Gstr1B2BRecord,
    Gstr1B2CLRecord,
    Gstr1B2CSRecord,
    Gstr1B2CSARecord,
    Gstr1CDNRRecord,
    Gstr1CDNURRecord,
    Gstr1DocIssueRecord,
    Gstr1EXPRecord,
    Gstr1HSNRecord,
    Gstr1NilRecord,
    Gstr1SummaryRecord,
    Gstr1TXPRecord,
)
from .services.gstr2a.models import (  # noqa: F401
    Gstr2AB2BRecord,
    Gstr2AB2BARecord,
    Gstr2ACDNARecord,
    Gstr2ACDNRecord,
    Gstr2ADocumentRecord,
    Gstr2AISDRecord,
    Gstr2ATDSRecord,
)
from .services.gstr2b.models import Gstr2BRecord, Gstr2BRegenerationStatusRecord  # noqa: F401
from .services.gstr3b.models import Gstr3BAutoLiabilityRecord, Gstr3BDetailsRecord  # noqa: F401
from .services.gstr9.models import (  # noqa: F401
    Gstr9AutoCalculatedRecord,
    Gstr9DetailsRecord,
    Gstr9Table8ARecord,
)
from .services.gst_return_status.models import GstReturnStatusRecord  # noqa: F401
from .services.ledger.models import (  # noqa: F401
    LedgerCashItcBalanceRecord,
    LedgerCashLedgerRecord,
    LedgerItcLedgerRecord,
    LedgerReturnLiabilityLedgerRecord,
)

logger = logging.getLogger(__name__)


async def create_all_tables() -> None:
    """Issue CREATE TABLE IF NOT EXISTS for every ORM model."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(
        "Schema initialised – %d tables registered on Base.metadata",
        len(Base.metadata.tables),
    )
