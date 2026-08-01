"""Define the state structures for the marketing agent."""

from __future__ import annotations

import operator
from typing import Annotated

from langgraph.graph import MessagesState


class MarketingAgentState(MessagesState):
    """State for the marketing agent."""
    market: dict
    tool_rounds: Annotated[int, operator.add] = 0
