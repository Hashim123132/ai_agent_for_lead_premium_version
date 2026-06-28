"""Server-side campaign save, evaluate, and approval — stores extended data."""

import json
import uuid
from datetime import datetime, timedelta

from shared.integrations.sheets_client import append_row, ensure_headers, get_all_records, update_cell

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
    "baseline_metrics_json",
    "evaluated_at",
    "evaluation_window_days",
]

SHEET_NAME = "Campaign Drafts"


def _read_current_metrics() -> dict:
    """Read current booking metrics for snapshot and evaluation."""
    cars = get_all_records("Cars")
    bookings = get_all_records("Bookings")

    total_cars = len(cars)
    unavailable = sum(1 for c in cars if str(c.get("Status", "")).strip().lower() == "unavailable")
    occupancy = round(unavailable / total_cars * 100, 1) if total_cars else 0
    total_bookings = len(bookings)

    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent = 0
    for b in bookings:
        raw_date = b.get("booking_date", b.get("Booking Date", ""))
        if raw_date:
            try:
                dt = datetime.fromisoformat(str(raw_date).replace("Z", ""))
                if dt > thirty_days_ago:
                    recent += 1
            except (ValueError, TypeError):
                pass

    car_counts = {}
    for b in bookings:
        car = str(b.get("car", b.get("Car", ""))).strip()
        if car:
            car_counts[car] = car_counts.get(car, 0) + 1

    popular = [name for name, _ in sorted(car_counts.items(), key=lambda x: -x[1])[:3]]

    return {
        "occupancy": occupancy,
        "bookings": total_bookings,
        "bookings_30d": recent,
        "popular_cars": popular,
    }


def save_campaign(prompt: str, output: str, city: str = "", country: str = "") -> str:
    """Append a campaign row with all extended fields. Returns campaign_id."""
    cid = str(uuid.uuid4())
    baseline = _read_current_metrics()
    now = datetime.now().isoformat()

    ensure_headers(SHEET_NAME, CAMPAIGN_HEADERS)
    append_row(SHEET_NAME, [
        "",                          # campaign_name
        "",                          # audience
        "",                          # suggested_offer
        "",                          # budget
        "",                          # expected_outcome
        "",                          # rationale
        "Draft",
        now,
        cid,
        prompt,
        output,
        "",                          # result_score
        city,
        country,
        json.dumps(baseline),        # baseline_metrics_json
        "",                          # evaluated_at
        "",                          # evaluation_window_days
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


def evaluate_campaign(campaign_id: str, window_days: int = 7) -> dict:
    """Evaluate an Approved campaign by comparing baseline to current metrics.

    Args:
        campaign_id: The campaign to evaluate.
        window_days: Days since approval to consider meaningful (default 7).

    Returns:
        Dict with baseline, current, impact, score, or error if not evaluable.
    """
    records = get_all_records(SHEET_NAME)
    for idx, row in enumerate(records, start=2):
        if row.get("campaign_id", "") == campaign_id:
            status = row.get("status", "")
            if status != "Approved":
                return {"status": "error", "error": "Only Approved campaigns can be evaluated."}

            baseline_raw = row.get("baseline_metrics_json", "")
            if not baseline_raw:
                return {"status": "error", "error": "No baseline snapshot found."}

            try:
                baseline = json.loads(baseline_raw)
            except (json.JSONDecodeError, TypeError):
                return {"status": "error", "error": "Invalid baseline snapshot."}

            created_at_str = row.get("created_at", "")
            if created_at_str:
                try:
                    created = datetime.fromisoformat(str(created_at_str).replace("Z", ""))
                    days_since = (datetime.now() - created).days
                except (ValueError, TypeError):
                    days_since = None
            else:
                days_since = None

            if days_since is not None and days_since < window_days:
                return {
                    "status": "error",
                    "error": f"Campaign is only {days_since} day(s) old. Minimum evaluation window is {window_days} days.",
                    "days_since": days_since,
                }

            current = _read_current_metrics()

            occ_diff = round(current["occupancy"] - baseline["occupancy"], 1)
            bk_diff = current["bookings"] - baseline["bookings"]
            bk30_diff = current["bookings_30d"] - baseline["bookings_30d"]

            score = _compute_score(baseline, current)

            now = datetime.now().isoformat()

            result_score_col = CAMPAIGN_HEADERS.index("result_score") + 1
            evaluated_at_col = CAMPAIGN_HEADERS.index("evaluated_at") + 1
            window_col = CAMPAIGN_HEADERS.index("evaluation_window_days") + 1

            update_cell(SHEET_NAME, idx, result_score_col, str(score))
            update_cell(SHEET_NAME, idx, evaluated_at_col, now)
            update_cell(SHEET_NAME, idx, window_col, str(window_days))

            return {
                "status": "ok",
                "campaign_id": campaign_id,
                "baseline": baseline,
                "current": current,
                "impact": {
                    "occupancy_change": occ_diff,
                    "bookings_change": bk_diff,
                    "bookings_30d_change": bk30_diff,
                },
                "score": score,
                "evaluated_at": now,
            }

    return {"status": "error", "error": "Campaign not found."}


def _compute_score(baseline: dict, current: dict) -> int:
    """Compute a 0-10 score based on metric improvements.

    Weighted: occupancy change (40%), 30d booking change (40%), total bookings (20%).
    """
    occ_improvement = current["occupancy"] - baseline["occupancy"]
    bk30_improvement = current["bookings_30d"] - baseline["bookings_30d"]
    bk_improvement = current["bookings"] - baseline["bookings"]

    occ_score = min(max(occ_improvement / 5 * 4, 0), 4)
    bk30_score = min(max(bk30_improvement / 2 * 4, 0), 4)
    bk_score = min(max(bk_improvement / 5 * 2, 0), 2)

    return round(occ_score + bk30_score + bk_score)


def list_campaigns() -> list[dict]:
    """Return all campaigns that have a campaign_id (server-saved rows)."""
    records = get_all_records(SHEET_NAME)
    return [r for r in records if r.get("campaign_id", "")]
