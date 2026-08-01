"""Detect whether an incoming message starts a new conversation.

The booking flow state lives entirely in the message history, so we ask a small
LLM to look at the last few messages and decide if the user is starting a fresh
conversation (new request, greeting after a completed/abandoned booking) rather
than continuing the current one.
"""

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_mistralai import ChatMistralAI

_CLASSIFIER_MODEL = ChatMistralAI(
    model="mistral-small-latest",
    temperature=0,
)

_CLASSIFIER_PROMPT = """You are classifying a Facebook Messenger conversation with a car rental booking assistant.

Here are the last messages of the conversation:
<conversation>
{conversation}
</conversation>

The user has just sent this new message:
<new_message>
{new_message}
</new_message>

Determine whether this new message STARTS A NEW CONVERSATION or CONTINUES the current one.

A NEW conversation starts when the user:
- sends a greeting or opens a new topic after a previous booking was completed or abandoned
- makes a brand-new request or booking request unrelated to the previous topic
- returns after a long break with a fresh request
- re-states the entire request from scratch (greeting + complete request), instead of answering the last question

The conversation CONTINUES when the user:
- answers a question (e.g. provides date, time, car model, name, location)
- confirms or corrects booking details
- asks for clarification about the ongoing request
- adds follow-up details to the current request

Reply with exactly one word: NEW or CONTINUE"""


def _render_message(message) -> str:
    """Serialize one history entry to a short 'Role: content' line."""
    if isinstance(message, tuple):
        role, content = message
        role_name = {"user": "User", "assistant": "Assistant", "ai": "Assistant"}.get(
            str(role).lower(), str(role)
        )
        return f"{role_name}: {str(content)[:300]}"
    if isinstance(message, HumanMessage):
        return f"User: {str(message.content)[:300]}"
    if isinstance(message, AIMessage):
        return f"Assistant: {str(message.content)[:300]}"
    if isinstance(message, ToolMessage):
        return f"Tool: {str(message.content)[:300]}"
    return str(message)[:300]


async def is_new_conversation(history: list, new_text: str) -> bool:
    """Return True if `new_text` starts a new conversation based on the history.

    Safely defaults to False (continue) when there is not enough context or the
    classifier call fails, so existing context is never dropped by accident.
    """
    if len(history) < 3:
        return False

    transcript = "\n".join(_render_message(m) for m in history[-3:])
    prompt = _CLASSIFIER_PROMPT.format(
        conversation=transcript,
        new_message=str(new_text)[:300],
    )

    try:
        response = await _CLASSIFIER_MODEL.ainvoke(
            [{"role": "user", "content": prompt}]
        )
        answer = str(getattr(response, "content", "")).strip().upper()
        return answer.startswith("NEW")
    except Exception:
        return False
