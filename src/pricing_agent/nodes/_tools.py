"""Tool definitions and ToolNode for the pricing agent."""

from langgraph.prebuilt import ToolNode

from pricing_agent.tools.car_inventory import get_car_inventory
from marketing_agent.tools.market_trends import search_market_trends
from shared.integrations.booking_metrics import get_booking_metrics

pricing_tools = [
    get_car_inventory,
    get_booking_metrics,
    search_market_trends,
]

pricing_tools_node = ToolNode(pricing_tools)
