"""This module defines the state graph for the react agent."""
from typing import Literal

from langgraph.graph import END, START, StateGraph
# from langgraph.prebuilt import tools_condition
from appointment_agent.configuration import Configuration
from appointment_agent.state import AppointmentAgentState
from appointment_agent.nodes import generate_response, find_car_availability, schedule_booking_tools_write_node

async def booking_tools_condition(state: AppointmentAgentState) -> Literal["find_car_availability",  "booking_tools", "__end__"]:
    """
    Determine if the conversation should continue to booking_tools or end
    """
    messages = state["messages"]
    last_message = messages[-1]
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
      for call in last_message.tool_calls:
          tool_name = call.get("name")
          if tool_name == "GOOGLECALENDAR_FIND_FREE_SLOTS":
            return "find_car_availability"
      return "booking_tools"
    return "__end__"

builder = StateGraph(AppointmentAgentState, config_schema=Configuration)

builder.add_node("agent", generate_response)
builder.add_node("find_car_availability", find_car_availability)
builder.add_node("booking_tools", schedule_booking_tools_write_node)

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", booking_tools_condition, ["booking_tools", "find_car_availability", END])
builder.add_edge("booking_tools", "agent")
builder.add_edge("find_car_availability", "agent")

appointment_agent_graph = builder.compile()

appointment_agent_graph.name = "appointment_agent_graph"
