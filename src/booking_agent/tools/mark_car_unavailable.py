"""Tool to mark a rental car as unavailable in Google Sheets after booking."""

import os
import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from langchain_core.tools import tool

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")


@tool
def mark_car_unavailable(car_name: str) -> str:
    """Mark a car as unavailable in the rental system after a successful booking.

    Args:
        car_name: The name of the car to mark as unavailable (e.g. "Toyota Corolla").
    """
    try:
        creds = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=SCOPES,
        )

        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(GOOGLE_SHEET_ID)
        worksheet = spreadsheet.worksheet("Cars")

        records = worksheet.get_all_records()
        headers = worksheet.row_values(1)

        try:
            status_col = headers.index("Status") + 1
        except ValueError as e:
            return f"Required column not found in sheet headers: {e}"

        for i, row in enumerate(records, start=2):
            if str(row.get("Car Name", "")).strip().lower() == car_name.strip().lower():
                current_status = str(row.get("Status", "")).strip().lower()
                if current_status == "unavailable":
                    return f"{car_name} is already marked as Unavailable."
                worksheet.update_cell(i, status_col, "Unavailable")
                return f"{car_name} marked as Unavailable"

        return f"Car '{car_name}' not found in the system."

    except Exception as e:
        return f"Error updating car status in Google Sheets: {str(e)}"
