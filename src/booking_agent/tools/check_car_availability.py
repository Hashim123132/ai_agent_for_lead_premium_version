"""Tool to check if a specific car is available in Google Sheets."""

import os

import gspread
from dotenv import load_dotenv
from langchain_core.tools import tool

from shared.integrations.sheets_client import load_google_credentials

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")


@tool
def check_car_availability(car_name: str) -> str:
    """Check if a specific car is available for booking.

    Args:
        car_name: The name of the car to check (e.g. "Toyota Corolla").
    """
    try:
        creds = load_google_credentials(SCOPES)

        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(GOOGLE_SHEET_ID)
        sheet = spreadsheet.worksheet("Cars")

        rows = sheet.get_all_records()

        for car in rows:
            if str(car.get("Car Name", "")).strip().lower() == car_name.strip().lower():
                status = str(car.get("Status", "")).strip().lower()
                car_type = car.get("Type", "N/A")
                price = car.get("Price Per Day", "N/A")
                if status == "available":
                    return (
                        f"{car_name} is Available. "
                        f"Type: {car_type}, Price per day: {price}."
                    )
                else:
                    return f"{car_name} is currently Unavailable."

        return f"Car '{car_name}' not found in the system."

    except Exception as e:
        return f"Error checking car availability: {str(e)}"
