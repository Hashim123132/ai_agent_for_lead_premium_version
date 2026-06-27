"""Define the state structures for the marketing agent."""

from __future__ import annotations

from langgraph.graph import MessagesState


class MarketingAgentState(MessagesState):
    """State for the marketing agent."""
    market: dict
