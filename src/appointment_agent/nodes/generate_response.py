"""This module contains the `generate_response` function which is responsible for generating a response."""

from typing import cast
import datetime
from langchain_mistralai import ChatMistralAI
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

from appointment_agent.state import AppointmentAgentState
from appointment_agent.prompts import AGENT_SYSTEM
from appointment_agent.nodes._tools import schedule_tools_set

model = ChatMistralAI(model = "mistral-small-latest")

model_with_tools = model.bind_tools(
    schedule_tools_set
)


def _trim_safe(messages, max_tokens):
    """Trim messages from the front, keeping complete tool_call + result pairs."""
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
    state: AppointmentAgentState, config: RunnableConfig
) -> dict[str, list[AIMessage]]:
    """Generate a response based on the given state and configuration.
    
    Args:
        state (AppointmentAgentState): The current state of the react graph.
        config (RunnableConfig): The configuration for running the model.

    Returns:
        dict[str, list[AIMessage]]: A dictionary containing the model's response messages.
    """

    # Format the system prompt. Customize this to change the agent's behavior.
    today_datetime = datetime.datetime.now().isoformat()
    system_message = AGENT_SYSTEM.format(today_datetime=today_datetime)

    trimmed = _trim_safe(
        state["messages"],
        max_tokens=60000,
    )

    # Get the model's response
    response = cast(
        AIMessage,
        await model_with_tools.ainvoke(
            [{"role": "system", "content": system_message}, *trimmed],
            config,
        ),
    )

    # Return the model's response as a list to be added to existing messages
    return {"messages": [response]}
