"""Server-side campaign save, evaluate, and approval — stores extended data."""

import json
import uuid
from datetime import datetime, timedelta

from shared.integrations.sheets_client import append_row, ensure_headers, get_all_records, update_cell
from shared.metrics_service import get_current_metrics, save_daily_metrics

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
    "approved_at",
    "is_active",
]

SHEET_NAME = "Campaign Drafts"


def save_campaign(prompt: str, output: str, city: str = "", country: str = "") -> str:
    """Append a campaign row with all extended fields. Returns campaign_id."""
    cid = str(uuid.uuid4())
    baseline = get_current_metrics()
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
        "",                          # approved_at
        "",                          # is_active
    ])
    return cid


def approve_campaign(campaign_id: str) -> dict:
    """Approve a campaign and set it as the single active campaign.

    Deactivates any previously active campaign. Returns a warning if another
    campaign was still within its evaluation window.

    Returns dict with status and optional warning.
    """
    records = get_all_records(SHEET_NAME)
    now = datetime.now().isoformat()
    warning = None
    found = False

    for idx, row in enumerate(records, start=2):
        cid = row.get("campaign_id", "")

        if cid == campaign_id:
            status_col = CAMPAIGN_HEADERS.index("status") + 1
            update_cell(SHEET_NAME, idx, status_col, "Approved")

            current = get_current_metrics()
            baseline_col = CAMPAIGN_HEADERS.index("baseline_metrics_json") + 1
            update_cell(SHEET_NAME, idx, baseline_col, json.dumps(current))

            approved_at_col = CAMPAIGN_HEADERS.index("approved_at") + 1
            update_cell(SHEET_NAME, idx, approved_at_col, now)

            window_col = CAMPAIGN_HEADERS.index("evaluation_window_days") + 1
            update_cell(SHEET_NAME, idx, window_col, "7")

            is_active_col = CAMPAIGN_HEADERS.index("is_active") + 1
            update_cell(SHEET_NAME, idx, is_active_col, "Yes")

            save_daily_metrics(active_campaign_id=campaign_id, force=False)
            found = True

        elif row.get("is_active", "") == "Yes" and cid != campaign_id:
            is_active_col = CAMPAIGN_HEADERS.index("is_active") + 1
            update_cell(SHEET_NAME, idx, is_active_col, "")

            approved_raw = row.get("approved_at", "")
            window_raw = row.get("evaluation_window_days", "7")
            if approved_raw:
                try:
                    approved_dt = datetime.fromisoformat(str(approved_raw).replace("Z", ""))
                    window = int(float(window_raw)) if window_raw else 7
                    days_active = (datetime.now() - approved_dt).days
                    if days_active < window:
                        warning = (
                            f"Another campaign ({cid}) was still active within its "
                            f"{window}-day evaluation window ({days_active} day(s) elapsed)."
                        )
                except (ValueError, TypeError):
                    pass

    if not found:
        return {"status": "error", "error": "Campaign not found"}

    result = {"status": "ok"}
    if warning:
        result["warning"] = warning
    return result


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

    Baseline is read from the Business Metrics sheet (snapshot taken at approval time).
    Falls back to baseline_metrics_json column if no Business Metrics row is found.

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

            baseline = _read_baseline_from_metrics_sheet(campaign_id, row)
            if baseline is None:
                return {"status": "error", "error": "No baseline snapshot found."}

            approved_at_str = row.get("approved_at", "")
            if approved_at_str:
                try:
                    approved = datetime.fromisoformat(str(approved_at_str).replace("Z", ""))
                    days_since = (datetime.now() - approved).days
                except (ValueError, TypeError):
                    days_since = None
            else:
                days_since = None

            row_window = row.get("evaluation_window_days", "")
            min_window = int(float(row_window)) if row_window else window_days

            if days_since is not None and days_since < min_window:
                return {
                    "status": "error",
                    "error": f"Campaign is only {days_since} day(s) old. Minimum evaluation window is {min_window} days.",
                    "days_since": days_since,
                }

            current = get_current_metrics()

            occ_diff = round(current["occupancy"] - baseline["occupancy"], 1)
            bk_diff = current["bookings"] - baseline["bookings"]
            bk30_diff = current["bookings_30d"] - baseline["bookings_30d"]

            score = _compute_score(baseline, current)

            now = datetime.now().isoformat()

            result_score_col = CAMPAIGN_HEADERS.index("result_score") + 1
            evaluated_at_col = CAMPAIGN_HEADERS.index("evaluated_at") + 1

            update_cell(SHEET_NAME, idx, result_score_col, str(score))
            update_cell(SHEET_NAME, idx, evaluated_at_col, now)

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


def _read_baseline_from_metrics_sheet(campaign_id: str, campaign_row: dict) -> dict | None:
    """Read baseline metrics from the Business Metrics sheet for a campaign.

    Falls back to baseline_metrics_json in the campaign row if no sheet entry exists.

    Returns a dict with keys (occupancy, bookings, bookings_30d) or None.
    """
    try:
        metrics_records = get_all_records("Business Metrics")
        for m in metrics_records:
            if m.get("active_campaign_id", "") == campaign_id:
                return {
                    "occupancy": float(m.get("occupancy_rate", 0)),
                    "bookings": int(float(m.get("total_bookings", 0))),
                    "bookings_30d": int(float(m.get("bookings_30d", 0))),
                }
    except Exception:
        pass

    baseline_raw = campaign_row.get("baseline_metrics_json", "")
    if not baseline_raw:
        return None

    try:
        return json.loads(baseline_raw)
    except (json.JSONDecodeError, TypeError):
        return None


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
