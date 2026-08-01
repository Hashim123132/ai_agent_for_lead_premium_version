"""Define the state structures for the lead generation agent."""

from __future__ import annotations

import operator
from typing import Annotated

from langgraph.graph import MessagesState


class LeadGenAgentState(MessagesState):
    """State for the lead generation agent."""
    market: dict
    tool_rounds: Annotated[int, operator.add] = 0
