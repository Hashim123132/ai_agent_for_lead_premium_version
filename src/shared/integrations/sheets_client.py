"""Shared Google Sheets client wrapper."""

import os
from functools import lru_cache

import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")


class SheetsClientError(Exception):
    """Raised when a Google Sheets operation fails."""


@lru_cache(maxsize=1)
def _get_client() -> gspread.Client:
    creds = Credentials.from_service_account_file(
        GOOGLE_CREDENTIALS_FILE,
        scopes=SCOPES,
    )
    return gspread.authorize(creds)


def _get_spreadsheet():
    return _get_client().open_by_key(GOOGLE_SHEET_ID)


def get_worksheet(name: str):
    """Get a worksheet by name from the spreadsheet."""
    return _get_spreadsheet().worksheet(name)


def get_or_create_worksheet(name: str, rows: int = 100, cols: int = 20):
    """Get a worksheet by name, creating it if it doesn't exist."""
    try:
        return get_worksheet(name)
    except gspread.exceptions.WorksheetNotFound:
        return _get_spreadsheet().add_worksheet(title=name, rows=rows, cols=cols)


def append_row(sheet_name: str, row: list):
    """Append a row to a worksheet."""
    ws = get_or_create_worksheet(sheet_name)
    ws.append_row(row)


def get_all_records(sheet_name: str) -> list[dict]:
    """Get all records from a worksheet as a list of dicts."""
    ws = get_worksheet(sheet_name)
    return ws.get_all_records()


def update_cell(sheet_name: str, row: int, col: int, value: str):
    """Update a specific cell in a worksheet."""
    ws = get_worksheet(sheet_name)
    ws.update_cell(row, col, value)


def ensure_headers(sheet_name: str, headers: list[str]):
    """Ensure a worksheet has the given headers. Adds missing columns if needed."""
    ws = get_or_create_worksheet(sheet_name)
    existing = ws.row_values(1)
    if not existing:
        ws.append_row(headers)
    elif len(existing) < len(headers):
        for col_idx, header in enumerate(headers[len(existing):], start=len(existing) + 1):
            ws.update_cell(1, col_idx, header)
