"""Tool to read booking analytics from Google Sheets."""

from datetime import datetime, timedelta

from langchain_core.tools import tool

from shared.integrations.sheets_client import get_all_records


@tool
def get_booking_metrics() -> str:
    """Read booking analytics: occupancy rate, popular cars, recent booking count, and estimated revenue.

    Fetches data from the Cars and Bookings sheets and returns a formatted summary.
    """
    try:
        cars = get_all_records("Cars")
        bookings = get_all_records("Bookings")

        total_cars = len(cars)
        unavailable = sum(
            1 for c in cars if str(c.get("Status", "")).strip().lower() == "unavailable"
        )
        occupancy = round(unavailable / total_cars * 100, 1) if total_cars else 0

        total_bookings = len(bookings)

        car_counts = {}
        for b in bookings:
            car = str(b.get("car", b.get("Car", ""))).strip()
            if car:
                car_counts[car] = car_counts.get(car, 0) + 1

        sorted_cars = sorted(car_counts.items(), key=lambda x: -x[1])
        popular = sorted_cars[:3] if sorted_cars else []

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

        lines = ["Booking Metrics:", f"- Total bookings: {total_bookings}"]
        lines.append(f"- Occupancy rate: {occupancy}% ({unavailable}/{total_cars} cars booked)")
        lines.append(f"- Bookings in last 30 days: {recent}")
        if popular:
            lines.append("- Most popular cars:")
            for car, count in popular:
                lines.append(f"    {car}: {count} bookings")
        else:
            lines.append("- No booking data yet")

        return "\n".join(lines)

    except Exception as e:
        return f"[TOOL STATUS] source=booking_metrics status=UNAVAILABLE reason=SERVICE_ERROR message={e!s}"
