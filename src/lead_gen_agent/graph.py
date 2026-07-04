"""StateGraph definition for the lead generation agent."""

from typing import Literal

from langgraph.graph import END, START, StateGraph

from lead_gen_agent.configuration import LeadGenConfiguration
from lead_gen_agent.nodes import generate_response, lead_gen_tools_node
from lead_gen_agent.state import LeadGenAgentState


def tools_condition(
    state: LeadGenAgentState,
) -> Literal["lead_gen_tools", "__end__"]:
    """Route to tools node if the last message has tool calls, otherwise end."""
    messages = state["messages"]
    last_message = messages[-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "lead_gen_tools"
    return "__end__"


builder = StateGraph(LeadGenAgentState, config_schema=LeadGenConfiguration)

builder.add_node("lead_gen_agent", generate_response)
builder.add_node("lead_gen_tools", lead_gen_tools_node)

builder.add_edge(START, "lead_gen_agent")
builder.add_conditional_edges(
    "lead_gen_agent",
    tools_condition,
    {"lead_gen_tools": "lead_gen_tools", "__end__": END},
)
builder.add_edge("lead_gen_tools", "lead_gen_agent")

lead_gen_agent_graph = builder.compile()

lead_gen_agent_graph.name = "lead_gen_agent_graph"
