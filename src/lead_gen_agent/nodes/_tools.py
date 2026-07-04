"""Tool definitions and ToolNode for the lead generation agent."""

from langgraph.prebuilt import ToolNode

from lead_gen_agent.tools.leads_crm import get_saved_leads, save_lead
from lead_gen_agent.tools.leads_search import search_business_leads

lead_gen_tools = [
    search_business_leads,
    save_lead,
    get_saved_leads,
]

lead_gen_tools_node = ToolNode(lead_gen_tools)
