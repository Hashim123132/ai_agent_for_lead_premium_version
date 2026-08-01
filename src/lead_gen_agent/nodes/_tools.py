"""Tool definitions and ToolNode for the lead generation agent."""

from langgraph.prebuilt import ToolNode

from lead_gen_agent.state import LeadGenAgentState
from lead_gen_agent.tools.leads_crm import get_saved_leads, save_lead
from lead_gen_agent.tools.leads_search import search_business_leads

MAX_TOOL_ROUNDS = 6

lead_gen_tools = [
    search_business_leads,
    save_lead,
    get_saved_leads,
]

_tool_node = ToolNode(lead_gen_tools)


def lead_gen_tools_node(state: LeadGenAgentState) -> dict:
    """Execute tool calls, counting each round toward the safety cap."""
    result = _tool_node.invoke(state)
    result["tool_rounds"] = 1
    return result
