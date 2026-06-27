"""Server-side campaign save — runs after the agent finishes, stores extended data."""

import uuid
from datetime import datetime

from shared.integrations.sheets_client import append_row, ensure_headers, update_cell, get_all_records

CAMPAIGN_HEADERS = [
    "campaign_name",
    "audience",
    "suggested_offer",
    "budget",
    "expected_outcome",
    "rationale",
    "status",
    "created_at",
    "campaign_id",
    "campaign_prompt",
    "campaign_output",
    "result_score",
    "market_city",
    "market_country",
]

SHEET_NAME = "Campaign Drafts"


def save_campaign(prompt: str, output: str, city: str = "", country: str = "") -> str:
    """Append a campaign row with all extended fields. Returns campaign_id."""
    cid = str(uuid.uuid4())
    ensure_headers(SHEET_NAME, CAMPAIGN_HEADERS)
    append_row(SHEET_NAME, [
        "",      # campaign_name — extracted later
        "",      # audience
        "",      # suggested_offer
        "",      # budget
        "",      # expected_outcome
        "",      # rationale
        "Draft",
        datetime.now().isoformat(),
        cid,
        prompt,
        output,
        "",      # result_score
        city,
        country,
    ])
    return cid


def approve_campaign(campaign_id: str) -> bool:
    """Set a campaign's status to 'Approved'. Returns True on success."""
    records = get_all_records(SHEET_NAME)
    for idx, row in enumerate(records, start=2):
        if row.get("campaign_id", "") == campaign_id:
            status_col = CAMPAIGN_HEADERS.index("status") + 1
            update_cell(SHEET_NAME, idx, status_col, "Approved")
            return True
    return False


def reject_campaign(campaign_id: str) -> bool:
    """Set a campaign's status to 'Rejected'. Returns True on success."""
    records = get_all_records(SHEET_NAME)
    for idx, row in enumerate(records, start=2):
        if row.get("campaign_id", "") == campaign_id:
            status_col = CAMPAIGN_HEADERS.index("status") + 1
            update_cell(SHEET_NAME, idx, status_col, "Rejected")
            return True
    return False


def list_campaigns() -> list[dict]:
    """Return all campaigns that have a campaign_id (server-saved rows)."""
    records = get_all_records(SHEET_NAME)
    return [r for r in records if r.get("campaign_id", "")]
