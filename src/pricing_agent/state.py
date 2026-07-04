"""Define the state structures for the pricing agent."""

from __future__ import annotations

from langgraph.graph import MessagesState


class PricingAgentState(MessagesState):
    """State for the pricing agent."""
    market: dict
