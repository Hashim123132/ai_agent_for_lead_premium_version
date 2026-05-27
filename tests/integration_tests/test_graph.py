import pytest
from langsmith import unit

from appointment_agent import appointment_agent_graph


@pytest.mark.asyncio
@unit
async def test_agent_basic_response() -> None:
    res = await appointment_agent_graph.ainvoke(
        {"messages": [("user", "hi, what cars do you have?")]},
    )

    assert len(str(res["messages"][-1].content).lower()) > 0
