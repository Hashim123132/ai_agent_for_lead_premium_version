"""Define the state structures for the pricing agent."""

from __future__ import annotations

import operator
from typing import Annotated

from langgraph.graph import MessagesState


class PricingAgentState(MessagesState):
    """State for the pricing agent."""
    market: dict
    tool_rounds: Annotated[int, operator.add] = 0
