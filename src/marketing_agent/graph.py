"""StateGraph definition for the marketing agent."""

from typing import Literal

from langgraph.graph import END, START, StateGraph

from marketing_agent.configuration import MarketingConfiguration
from marketing_agent.nodes import generate_response, marketing_tools_node
from marketing_agent.state import MarketingAgentState


def tools_condition(
    state: MarketingAgentState,
) -> Literal["marketing_tools", "__end__"]:
    """Route to tools node if the last message has tool calls, otherwise end."""
    messages = state["messages"]
    last_message = messages[-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "marketing_tools"
    return "__end__"


builder = StateGraph(MarketingAgentState, config_schema=MarketingConfiguration)

builder.add_node("marketing_agent", generate_response)
builder.add_node("marketing_tools", marketing_tools_node)

builder.add_edge(START, "marketing_agent")
builder.add_conditional_edges(
    "marketing_agent",
    tools_condition,
    {"marketing_tools": "marketing_tools", "__end__": END},
)
builder.add_edge("marketing_tools", "marketing_agent")

marketing_agent_graph = builder.compile()

marketing_agent_graph.name = "marketing_agent_graph"
