"""StateGraph definition for the pricing agent."""

from typing import Literal

from langgraph.graph import END, START, StateGraph

from pricing_agent.configuration import PricingConfiguration
from pricing_agent.nodes import generate_response, pricing_tools_node
from pricing_agent.state import PricingAgentState


def tools_condition(
    state: PricingAgentState,
) -> Literal["pricing_tools", "__end__"]:
    """Route to tools node if the last message has tool calls, otherwise end."""
    messages = state["messages"]
    last_message = messages[-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "pricing_tools"
    return "__end__"


builder = StateGraph(PricingAgentState, config_schema=PricingConfiguration)

builder.add_node("pricing_agent", generate_response)
builder.add_node("pricing_tools", pricing_tools_node)

builder.add_edge(START, "pricing_agent")
builder.add_conditional_edges(
    "pricing_agent",
    tools_condition,
    {"pricing_tools": "pricing_tools", "__end__": END},
)
builder.add_edge("pricing_tools", "pricing_agent")

pricing_agent_graph = builder.compile()

pricing_agent_graph.name = "pricing_agent_graph"
