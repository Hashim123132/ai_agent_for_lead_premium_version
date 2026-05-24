"""Tool to read available rental cars from Google Sheets."""

import os
import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from langchain_core.tools import tool

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")


@tool
def get_available_cars() -> str:
    """Get available rental cars from Google Sheets."""
    try:
        creds = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=SCOPES,
        )

        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(GOOGLE_SHEET_ID)
        sheet = spreadsheet.worksheet("Cars")

        rows = sheet.get_all_records()

        available_cars = []

        for car in rows:
            status = str(car.get("Status", "")).strip().lower()

            if status == "available":
                available_cars.append(car)

        if not available_cars:
            return "No cars are currently available."

        result = "Available cars:\n"

        for car in available_cars:
            result += (
                f"- {car.get('Car Name')} | "
                f"Type: {car.get('Type')} | "
                f"Price per day: {car.get('Price Per Day')} | "
                f"Status: {car.get('Status')}\n"
            )

        return result

    except Exception as e:
        return f"Error reading cars from Google Sheets: {str(e)}"