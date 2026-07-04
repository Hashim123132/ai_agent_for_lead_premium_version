"""Tool to read current car inventory with pricing and availability."""

from langchain_core.tools import tool

from shared.integrations.sheets_client import get_all_records


@tool
def get_car_inventory() -> str:
    """Read the current car fleet: availability, category, and daily price.

    Returns formatted inventory by category with per-car pricing.
    """
    try:
        cars = get_all_records("Cars")
    except Exception as e:
        return f"[TOOL STATUS] source=car_inventory status=UNAVAILABLE reason=SERVICE_ERROR message={e!s}"

    if not cars:
        return "[TOOL STATUS] source=car_inventory status=EMPTY reason=No cars found in sheet."

    by_type = {}
    for c in cars:
        car_name = str(c.get("Car Name", c.get("car_name", ""))).strip()
        status = str(c.get("Status", "")).strip().lower()
        car_type = str(c.get("Type", "")).strip() or "Uncategorized"
        price = str(c.get("Price Per Day", "")).strip() or "N/A"

        by_type.setdefault(car_type, {"available": [], "unavailable": [], "total": 0})
        by_type[car_type]["total"] += 1
        if status == "available":
            by_type[car_type]["available"].append(f"{car_name} (${price}/day)")
        else:
            by_type[car_type]["unavailable"].append(car_name)

    lines = ["Current Car Inventory:", ""]
    total_available = 0
    total_cars = len(cars)

    for car_type in sorted(by_type.keys()):
        data = by_type[car_type]
        avail = data["available"]
        unavail = data["unavailable"]
        total_available += len(avail)
        lines.append(f"{car_type} — {len(avail)} available, {len(unavail)} booked of {data['total']} total")
        if avail:
            lines.append("  Available:")
            for a in avail:
                lines.append(f"    • {a}")
        lines.append("")

    lines.append(f"Total: {total_available} available of {total_cars} cars")
    lines.append(f"Current occupancy: {round((total_cars - total_available) / total_cars * 100, 1)}%")

    return "\n".join(lines)
