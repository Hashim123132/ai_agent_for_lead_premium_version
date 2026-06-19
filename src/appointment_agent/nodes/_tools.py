"""This module defines the tools for agent."""

import os
import dotenv
import logging
from appointment_agent.tools.get_available_cars import get_available_cars
from appointment_agent.tools.mark_car_unavailable import mark_car_unavailable
from appointment_agent.tools.save_booking import save_booking
from appointment_agent.tools.check_car_availability import check_car_availability
from langgraph.prebuilt import ToolNode
from composio import Composio
from composio_langgraph import LanggraphProvider

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
logger = logging.getLogger(__name__)

# Load environment variables
dotenv.load_dotenv()

# Initialize Composio with LanggraphProvider
composio = Composio(provider=LanggraphProvider(), api_key=os.getenv("COMPOSIO_API_KEY"))

# Get the required tools (fetched by slug)
schedule_tools_set = composio.tools.get(
    user_id="pg-test-9cd0c129-70a9-4e30-a087-36249fe06d7e",
    tools=[
        "GOOGLECALENDAR_FIND_FREE_SLOTS",
        "GOOGLECALENDAR_CREATE_EVENT",
        "GMAIL_CREATE_EMAIL_DRAFT",
    ],
)
schedule_tools_set = schedule_tools_set + [get_available_cars] + [mark_car_unavailable] + [save_booking] + [check_car_availability]

# Separate out write-only tools
schedule_tools_write = composio.tools.get(
    user_id="pg-test-9cd0c129-70a9-4e30-a087-36249fe06d7e",
    tools=[
        "GOOGLECALENDAR_CREATE_EVENT",
        "GMAIL_CREATE_EMAIL_DRAFT",
    ],
)

schedule_tools_write_node = ToolNode(
    schedule_tools_write
    + [get_available_cars]
    + [check_car_availability]
    + [mark_car_unavailable]
    + [save_booking]
)