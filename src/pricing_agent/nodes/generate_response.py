"""LLM response generation node for the pricing agent."""

import datetime
from typing import cast

from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_mistralai import ChatMistralAI

from pricing_agent.nodes._tools import pricing_tools
from pricing_agent.prompts import PRICING_SYSTEM
from pricing_agent.state import PricingAgentState

model = ChatMistralAI(model="mistral-small-latest")

model_with_tools = model.bind_tools(pricing_tools)


def _trim_safe(messages, max_tokens):
    groups = []
    i = 0
    while i < len(messages):
        msg = messages[i]
        if isinstance(msg, AIMessage) and msg.tool_calls:
            ids = {tc["id"] for tc in msg.tool_calls if "id" in tc}
            group = [msg]
            i += 1
            while i < len(messages) and isinstance(messages[i], ToolMessage) and messages[i].tool_call_id in ids:
                group.append(messages[i])
                i += 1
            groups.append(group)
        else:
            groups.append([messages[i]])
            i += 1

    total = 0
    keep = []
    for group in reversed(groups):
        tokens = sum(len(str(m.content)) // 4 + 100 for m in group)
        if total + tokens > max_tokens:
            break
        keep.append(group)
        total += tokens

    result = []
    for group in reversed(keep):
        result.extend(group)

    call_ids = set()
    for msg in result:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                tid = tc.get("id") or tc.get("tool_call_id")
                if tid:
                    call_ids.add(tid)

    result = [m for m in result if not (isinstance(m, ToolMessage) and m.tool_call_id not in call_ids)]
    return result


async def generate_response(
    state: PricingAgentState, config: RunnableConfig
) -> dict[str, list[AIMessage]]:
    """Generate a pricing recommendation based on inventory, bookings, and market data."""
    today_datetime = datetime.datetime.now().isoformat()
    market = state.get("market", {})
    system_message = PRICING_SYSTEM.format(
        today_datetime=today_datetime,
        market_city=market.get("city", ""),
        market_country=market.get("country", ""),
    )

    trimmed = _trim_safe(
        state["messages"],
        max_tokens=60000,
    )

    response = cast(
        AIMessage,
        await model_with_tools.ainvoke(
            [{"role": "system", "content": system_message}, *trimmed],
            config,
        ),
    )

    return {"messages": [response]}
