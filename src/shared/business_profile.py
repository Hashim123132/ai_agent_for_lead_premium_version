"""Business Profile sheet — store and retrieve business info for AI personalization."""

from shared.integrations.sheets_client import append_row, ensure_headers, get_all_records, update_cell, get_worksheet

SHEET_NAME = "Business Profile"

PROFILE_HEADERS = [
    "business_name",
    "city",
    "country",
    "fleet_types",
    "budget_min",
    "budget_max",
    "brand_tone",
    "target_market",
    "preferred_channels",
    "business_goals",
]

DEFAULT_PROFILE: dict[str, str] = {
    "business_name": "",
    "city": "",
    "country": "",
    "fleet_types": "",
    "budget_min": "",
    "budget_max": "",
    "brand_tone": "",
    "target_market": "",
    "preferred_channels": "",
    "business_goals": "",
}


def _row_to_dict(row: list[str]) -> dict[str, str]:
    return dict(zip(PROFILE_HEADERS, row + [""] * (len(PROFILE_HEADERS) - len(row))))


def get_profile() -> dict[str, str]:
    """Read the first data row from the Business Profile sheet.

    Returns a dict of profile fields (all strings), or DEFAULT_PROFILE if empty.
    """
    try:
        ws = get_worksheet(SHEET_NAME)
        rows = ws.get_all_values()
        if len(rows) >= 2:
            return _row_to_dict(rows[1])
    except Exception:
        pass
    return dict(DEFAULT_PROFILE)


def update_profile(profile: dict[str, str]) -> dict[str, str]:
    """Upsert the first data row of the Business Profile sheet.

    If the sheet has a header row but no data, appends a new row.
    If data exists, updates the first data row in place.
    Returns the saved profile.
    """
    merged = {**DEFAULT_PROFILE, **profile}
    row_values = [merged.get(h, "") for h in PROFILE_HEADERS]

    try:
        ws = get_worksheet(SHEET_NAME)
        rows = ws.get_all_values()
        if len(rows) >= 2:
            for col_idx, val in enumerate(row_values, start=1):
                update_cell(SHEET_NAME, 2, col_idx, val)
        else:
            ensure_headers(SHEET_NAME, PROFILE_HEADERS)
            append_row(SHEET_NAME, row_values)
    except Exception:
        ensure_headers(SHEET_NAME, PROFILE_HEADERS)
        append_row(SHEET_NAME, row_values)

    return merged


def format_profile_for_prompt(profile: dict[str, str]) -> str:
    """Format the business profile as a structured context block for AI prompts."""
    parts = []
    if profile.get("business_name"):
        parts.append(f"Business Name: {profile['business_name']}")
    if profile.get("city") or profile.get("country"):
        loc = f"{profile.get('city', '')}, {profile.get('country', '')}".strip(", ")
        parts.append(f"Location: {loc}")
    if profile.get("fleet_types"):
        parts.append(f"Fleet Types: {profile['fleet_types']}")
    if profile.get("budget_min") or profile.get("budget_max"):
        budget = f"${profile['budget_min']} - ${profile['budget_max']}" if profile.get("budget_min") and profile.get("budget_max") else profile.get("budget_min") or profile.get("budget_max")
        parts.append(f"Budget Range: {budget}")
    if profile.get("brand_tone"):
        parts.append(f"Brand Tone: {profile['brand_tone']}")
    if profile.get("target_market"):
        parts.append(f"Target Market: {profile['target_market']}")
    if profile.get("preferred_channels"):
        parts.append(f"Preferred Marketing Channels: {profile['preferred_channels']}")
    if profile.get("business_goals"):
        parts.append(f"Business Goals: {profile['business_goals']}")

    if not parts:
        return ""

    return "BUSINESS CONTEXT:\n" + "\n".join(parts)
