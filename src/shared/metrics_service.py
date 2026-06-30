"""Business Metrics sheet — daily snapshots and historical queries."""

from datetime import datetime, timedelta

from shared.integrations.sheets_client import append_row, ensure_headers, get_all_records

BUSINESS_METRICS_HEADERS = [
    "date",
    "total_bookings",
    "bookings_30d",
    "occupancy_rate",
    "revenue",
    "active_campaign_id",
]

SHEET_NAME = "Business Metrics"


def get_current_metrics() -> dict:
    """Read current booking metrics — occupancy, total bookings, and 30-day bookings."""
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

    return {
        "occupancy": occupancy,
        "bookings": total_bookings,
        "bookings_30d": recent,
    }


def save_daily_metrics(active_campaign_id: str = "", force: bool = False) -> dict:
    """Snapshot current metrics into the Business Metrics sheet.

    When force=False (default), skips appending if a row already exists for the
    same campaign on the same calendar date to avoid duplicate snapshots.
    When force=True, always appends a new row.

    Args:
        active_campaign_id: Optional campaign ID to associate with this snapshot.
        force: If True, always append; if False, skip on duplicate date+campaign.

    Returns:
        The saved (or existing) snapshot as a dict.
    """
    current = get_current_metrics()
    date_str = datetime.now().isoformat()
    today_prefix = date_str[:10]

    if not force and active_campaign_id:
        try:
            existing = get_all_records(SHEET_NAME)
            for row in existing:
                row_date = str(row.get("date", ""))[:10]
                row_cid = str(row.get("active_campaign_id", ""))
                if row_date == today_prefix and row_cid == active_campaign_id:
                    return {
                        "date": row.get("date", date_str),
                        "total_bookings": int(float(row.get("total_bookings", 0))),
                        "bookings_30d": int(float(row.get("bookings_30d", 0))),
                        "occupancy_rate": float(row.get("occupancy_rate", 0)),
                        "revenue": row.get("revenue", ""),
                        "active_campaign_id": active_campaign_id,
                        "existing": True,
                    }
        except Exception:
            pass

    ensure_headers(SHEET_NAME, BUSINESS_METRICS_HEADERS)
    append_row(SHEET_NAME, [
        date_str,
        current["bookings"],
        current["bookings_30d"],
        current["occupancy"],
        "",
        active_campaign_id,
    ])

    return {
        "date": date_str,
        "total_bookings": current["bookings"],
        "bookings_30d": current["bookings_30d"],
        "occupancy_rate": current["occupancy"],
        "revenue": "",
        "active_campaign_id": active_campaign_id,
    }


def get_metrics_range(start_date: str = "", end_date: str = "") -> list[dict]:
    """Return metrics from the Business Metrics sheet, optionally filtered by date range.

    Date filtering uses simple string comparison on ISO-format date strings.
    """
    try:
        records = get_all_records(SHEET_NAME)
    except Exception:
        return []

    if start_date:
        records = [r for r in records if r.get("date", "") >= start_date]
    if end_date:
        records = [r for r in records if r.get("date", "") <= end_date]

    return records
