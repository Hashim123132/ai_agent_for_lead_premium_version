"""Tool definitions and ToolNode for the marketing agent."""

from langgraph.prebuilt import ToolNode

from marketing_agent.state import MarketingAgentState
from marketing_agent.tools.campaign_export import save_campaign_draft
from marketing_agent.tools.past_campaigns import analyze_past_campaigns
from marketing_agent.tools.relevant_ads import search_relevant_ads
from marketing_agent.tools.market_trends import search_market_trends
from shared.integrations.booking_metrics import get_booking_metrics

MAX_TOOL_ROUNDS = 6

marketing_tools = [
    get_booking_metrics,
    search_relevant_ads,
    search_market_trends,
    analyze_past_campaigns,
    save_campaign_draft,
]

_tool_node = ToolNode(marketing_tools)


def marketing_tools_node(state: MarketingAgentState) -> dict:
    """Execute tool calls, counting each round toward the safety cap."""
    result = _tool_node.invoke(state)
    result["tool_rounds"] = 1
    return result
