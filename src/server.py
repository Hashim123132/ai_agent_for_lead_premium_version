"""FastAPI server for Facebook Messenger webhook integration."""

import os
import asyncio
import logging
from collections import defaultdict

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
import requests

from appointment_agent import appointment_agent_graph

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI()

VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN", "hashim_webhook_123")
PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN")
API_VERSION = "v18.0"

conversations: dict[str, list] = defaultdict(list)


def _send_action(sender_id: str, action: str):
    """Send a sender action (typing_on / typing_off) to Facebook."""
    try:
        requests.post(
            f"https://graph.facebook.com/{API_VERSION}/me/messages",
            params={"access_token": PAGE_ACCESS_TOKEN},
            json={"recipient": {"id": sender_id}, "sender_action": action},
        )
    except Exception:
        pass


async def _keep_typing(sender_id: str):
    """Refresh typing indicator every 15 seconds."""
    while True:
        await asyncio.sleep(15)
        _send_action(sender_id, "typing_on")


@app.get("/facebook/webhook")
async def verify(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        return Response(content=challenge, media_type="text/plain", status_code=200)

    logger.warning("Webhook verification failed")
    return Response(content="Verification failed", status_code=403)


async def _handle_message(sender_id: str, text: str):
    """Process a message through the graph and send reply (runs in background)."""
    logger.info("[%s] Starting graph processing: %s", sender_id, text[:80])

    _send_action(sender_id, "typing_on")
    refresher = asyncio.create_task(_keep_typing(sender_id))

    history = conversations.get(sender_id, [])
    state = {"messages": [*history, ("user", text)]}

    try:
        result = await appointment_agent_graph.ainvoke(state)
        logger.info("[%s] Graph finished", sender_id)

        new_messages = result.get("messages", [])
        conversations[sender_id] = list(new_messages)
        logger.info("[%s] History updated (%s messages)", sender_id, len(new_messages))

        response_text = None
        for msg in reversed(new_messages):
            if hasattr(msg, "content") and msg.content and not getattr(msg, "tool_calls", None):
                response_text = msg.content
                break

        if not response_text:
            logger.warning("[%s] No text response found in graph output", sender_id)
            return

        logger.info("[%s] Sending reply (%s chars)", sender_id, len(response_text))

        resp = requests.post(
            f"https://graph.facebook.com/{API_VERSION}/me/messages",
            params={"access_token": PAGE_ACCESS_TOKEN},
            json={
                "recipient": {"id": sender_id},
                "message": {"text": response_text},
            },
        )
        logger.info("[%s] Reply sent (status %s)", sender_id, resp.status_code)

    except Exception as e:
        logger.error("[%s] Error: %s", sender_id, e, exc_info=True)
    finally:
        refresher.cancel()


@app.post("/facebook/webhook")
async def webhook(request: Request):
    body = await request.json()
    logger.info("Received webhook event")

    for entry in body.get("entry", []):
        for event in entry.get("messaging", []):
            sender_id = event.get("sender", {}).get("id")
            message = event.get("message", {})
            text = message.get("text", "")

            if not text or not sender_id:
                continue

            logger.info("[%s] Queueing message: %s", sender_id, text[:80])
            asyncio.create_task(_handle_message(sender_id, text))

    return {"status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok", "agent": appointment_agent_graph.name}
