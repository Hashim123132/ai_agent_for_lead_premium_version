"""Tool to save booking details to the Bookings sheet in Google Sheets."""

import os
from datetime import datetime
import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from langchain_core.tools import tool

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")


@tool
def save_booking(
    customer_name: str,
    phone: str,
    email: str,
    car: str,
    pickup_location: str,
    pickup_time: str,
    return_time: str,
) -> str:
    """Save a confirmed booking record to the Bookings sheet.

    Args:
        customer_name: Full name of the customer.
        phone: Customer's phone number.
        email: Customer's email address.
        car: Name of the booked car (e.g. "Toyota Corolla").
        pickup_location: Location where the car will be picked up.
        pickup_time: Pickup date and time in ISO format.
        return_time: Return date and time in ISO format.
    """
    try:
        creds = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=SCOPES,
        )

        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(GOOGLE_SHEET_ID)
        worksheet = spreadsheet.worksheet("Bookings")

        booking_date = datetime.now().isoformat()

        row = [
            customer_name,
            phone,
            email,
            car,
            pickup_location,
            pickup_time,
            return_time,
            booking_date,
        ]

        worksheet.append_row(row)

        return f"Booking saved successfully for {customer_name} — {car}."

    except Exception as e:
        return f"Error saving booking to Google Sheets: {str(e)}"
