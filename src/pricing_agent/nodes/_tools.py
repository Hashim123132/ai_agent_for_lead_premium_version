"""Tool definitions and ToolNode for the pricing agent."""

from langgraph.prebuilt import ToolNode

from pricing_agent.state import PricingAgentState
from pricing_agent.tools.car_inventory import get_car_inventory
from marketing_agent.tools.market_trends import search_market_trends
from shared.integrations.booking_metrics import get_booking_metrics

MAX_TOOL_ROUNDS = 6

pricing_tools = [
    get_car_inventory,
    search_market_trends,
    get_booking_metrics,
]

_tool_node = ToolNode(pricing_tools)


def pricing_tools_node(state: PricingAgentState) -> dict:
    """Execute tool calls, counting each round toward the safety cap."""
    result = _tool_node.invoke(state)
    result["tool_rounds"] = 1
    return result
