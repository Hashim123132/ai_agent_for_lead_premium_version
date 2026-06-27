"""Tool to save a campaign draft to Google Sheets for dashboard review."""

from datetime import datetime

from langchain_core.tools import tool

from shared.integrations.sheets_client import append_row, ensure_headers

CAMPAIGN_HEADERS = [
    "campaign_name",
    "audience",
    "suggested_offer",
    "budget",
    "expected_outcome",
    "rationale",
    "status",
    "created_at",
]


@tool
def save_campaign_draft(
    campaign_name: str,
    audience: str,
    suggested_offer: str,
    budget: str,
    expected_outcome: str,
    rationale: str,
) -> str:
    """Save a campaign recommendation draft to the Campaign Drafts sheet for human review.

    Args:
        campaign_name: Short descriptive name for the campaign (e.g. "Weekend SUV Flash Sale").
        audience: Target audience for the campaign (e.g. "families", "business travellers", "tourists").
        suggested_offer: The promotional offer (e.g. "20% off SUV rentals", "Free weekend upgrade").
        budget: Recommended budget amount (e.g. "$200", "$500").
        expected_outcome: Expected results (e.g. "5-8 additional bookings over the weekend").
        rationale: Explanation of why this strategy fits the data.
    """
    try:
        ensure_headers("Campaign Drafts", CAMPAIGN_HEADERS)

        row = [
            campaign_name,
            audience,
            suggested_offer,
            budget,
            expected_outcome,
            rationale,
            "Draft",
            datetime.now().isoformat(),
        ]

        append_row("Campaign Drafts", row)

        return (
            f"Campaign draft saved successfully.\n"
            f"Campaign: {campaign_name}\n"
            f"Audience: {audience}\n"
            f"Offer: {suggested_offer}\n"
            f"Budget: {budget}\n"
            f"Expected outcome: {expected_outcome}\n"
            f"Status: Draft (pending dashboard approval)"
        )

    except Exception as e:
        return f"Error saving campaign draft to Google Sheets: {str(e)}"
