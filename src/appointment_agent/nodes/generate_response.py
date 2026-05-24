"""This module contains the `generate_response` function which is responsible for generating a response."""

from typing import cast
import datetime
from langchain_mistralai import ChatMistralAI
from langchain_core.messages import AIMessage, trim_messages
from langchain_core.runnables import RunnableConfig

from appointment_agent.state import AppointmentAgentState
from appointment_agent.prompts import AGENT_SYSTEM
from appointment_agent.nodes._tools import schedule_tools_set, make_confirmation_call

model = ChatMistralAI(model = "mistral-small-latest")

model_with_tools = model.bind_tools(
    schedule_tools_set
    + [make_confirmation_call]
)
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

    trimmedStateMessages = trim_messages(
        state["messages"],
        max_tokens=60000,  # adjust for model's context window minus system & files message
        strategy="last",
        token_counter=model,
        include_system=False,  # Not needed since systemMessage is added separately
        allow_partial=True,
    )

    # Get the model's response
    response = cast(
        AIMessage,
        await model_with_tools.ainvoke(
            [{"role": "system", "content": system_message}, *trimmedStateMessages],
            config,
        ),
    )

    # Return the model's response as a list to be added to existing messages
    return {"messages": [response]}
