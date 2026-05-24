import requests
import dotenv
import os
from langchain_core.tools import tool

# Load environment variables
dotenv.load_dotenv()

BLAND_API_KEY = os.environ.get("BLAND_API_KEY")
@tool
def make_confirmation_call(phone_number: str, instructions: str) -> dict:
    """
    Makes a confirmation call to a customer using the Bland.ai API.

    Use this tool when you need to call a customer to confirm a booking.
    
    Args:
        phone_number: The recipient's phone number.
        instructions: The message/instructions to be delivered during the call.
    
    Returns:
        A dictionary containing the API response.
    """
    url = "https://api.bland.ai/v1/calls"

    payload = {
        "phone_number": phone_number,
        "task": instructions
    }

    headers = {
        "authorization": BLAND_API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)

    return response.json()