"""Tools to save leads to the CRM sheet and generate outreach drafts."""

from datetime import datetime

from langchain_core.tools import tool

from shared.integrations.sheets_client import append_row, ensure_headers, get_all_records, update_cell

LEADS_HEADERS = [
    "business_name",
    "type",
    "source",
    "city",
    "country",
    "contact_info",
    "score",
    "status",
    "notes",
    "outreach_draft",
    "created_at",
]

SHEET_NAME = "Leads"


@tool
def save_lead(
    business_name: str,
    lead_type: str = "",
    source: str = "",
    city: str = "",
    country: str = "",
    contact_info: str = "",
    score: int = 0,
    notes: str = "",
    outreach_draft: str = "",
) -> str:
    """Save a qualified lead to the CRM sheet.

    Args:
        business_name: Name of the business or contact
        lead_type: Type (hotel, travel agency, corporate, etc.)
        source: Where the lead was found (web search, referral, etc.)
        city: City the business is in
        country: Country the business is in
        contact_info: Phone, email, website, or other contact details
        score: Lead score from 0-100
        notes: Any additional notes or qualification details
        outreach_draft: Generated outreach message draft

    Returns:
        Confirmation with the lead name and score.
    """
    ensure_headers(SHEET_NAME, LEADS_HEADERS)
    append_row(SHEET_NAME, [
        business_name,
        lead_type,
        source,
        city,
        country,
        contact_info,
        str(score),
        "New",
        notes,
        outreach_draft,
        datetime.now().isoformat(),
    ])
    return f"Lead saved: {business_name} ({lead_type}) — Score: {score}/100"


@tool
def get_saved_leads(status: str = "") -> str:
    """Read saved leads from the CRM sheet, optionally filtered by status.

    Args:
        status: Filter by status ("New", "Contacted", "Qualified", "Converted", "Lost"). Leave empty for all.

    Returns:
        Formatted list of saved leads.
    """
    try:
        records = get_all_records(SHEET_NAME)
    except Exception as e:
        return f"[TOOL STATUS] source=leads_crm status=UNAVAILABLE reason=SERVICE_ERROR message={e!s}"

    if status:
        records = [r for r in records if r.get("status", "").lower() == status.lower()]

    if not records:
        return f"No leads found{'' if not status else f' with status \"{status}\"'}."

    lines = [f"Saved Leads ({len(records)}):", ""]
    for r in records:
        name = r.get("business_name", "Unknown")
        typ = r.get("type", "")
        score = r.get("score", "N/A")
        st = r.get("status", "")
        city = r.get("city", "")
        lines.append(f"  • {name} ({typ}) — Score: {score}/100 — Status: {st} {f'— {city}' if city else ''}")
    return "\n".join(lines)
