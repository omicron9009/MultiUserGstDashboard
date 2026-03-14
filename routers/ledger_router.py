import requests
from typing import Dict, Any, Optional
from config import BASE_URL, API_KEY, API_VERSION
from session_storage import get_session
from services.ledger_service import *
from fastapi import APIRouter , HTTPException, Query

router = APIRouter(prefix="/ledgers", tags=["ledgers"])




@router.get("/ledgers/{gstin}/{year}/{month}/balance")
async def cash_itc_balance(gstin: str, year: str, month: str):
    result = await get_cash_itc_balance(gstin, year, month)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)

    return result


@router.get("/ledgers/{gstin}/cash")
async def cash_ledger(
    gstin: str,
    from_date: str = Query(..., alias="from"),
    to_date:   str = Query(..., alias="to"),
):
    result = await get_cash_ledger(gstin, from_date, to_date)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)

    return result


@router.get("/ledgers/{gstin}/itc")
async def itc_ledger(
    gstin: str,
    from_date: str = Query(..., alias="from"),
    to_date:   str = Query(..., alias="to"),
):
    result = await get_itc_ledger(gstin, from_date, to_date)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)

    return result

@router.get("/ledgers/{gstin}/tax/{year}/{month}")
async def return_liability_ledger(
    gstin:     str,
    year:      str,
    month:     str,
    from_date: str = Query(..., alias="from"),
    to_date:   str = Query(..., alias="to"),
):
    result = await get_return_liability_ledger(gstin, year, month, from_date, to_date)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)

    return result