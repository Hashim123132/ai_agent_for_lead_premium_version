"""Follow-up manager for ghosted booking conversations."""

import asyncio
import logging
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

BOOKING_INTENT_KEYWORDS = [
    "rent", "book", "want", "how much", "price", "available",
    "need a car", "looking for", "interested", "cost",
    "i need", "i want", "can i", "would like",
]

FOLLOWUP_TEMPLATES = [
    "Hi there! I noticed you were interested in renting a car from Hashim Car Rentals. Would you like any help choosing a vehicle or have any questions? Feel free to reach out anytime! 🚗",
    "Hello again! Just checking in — are you still looking for a car rental? We have some great options available. Let me know if you'd like to discuss further! 😊",
]


class FollowupManager:
    """Tracks conversations with booking intent and sends template-based follow-ups.

    No LLM is used — templates are hardcoded.
    Max 2 follow-ups per conversation, 24h delay before the first one.
    State is kept in-memory.
    """

    def __init__(self, page_access_token: str, api_version: str = "v18.0"):
        self._followups: dict[str, dict] = {}
        self._page_access_token = page_access_token
        self._api_version = api_version

    def track(self, sender_id: str, messages: list):
        """Analyze a finished conversation and start follow-up tracking if needed.

        Call this after the graph finishes processing a message.
        """
        if sender_id in self._followups:
            if self._has_booking_completed(messages):
                self._followups.pop(sender_id, None)
            else:
                self._followups[sender_id]["last_message_time"] = datetime.now()
            return

        if self._has_booking_completed(messages):
            return

        if not self._detect_booking_intent(messages):
            return

        self._followups[sender_id] = {
            "stage": 0,
            "last_message_time": datetime.now(),
            "first_followup_sent": False,
            "second_followup_sent": False,
        }
        logger.info("[followup] Tracking %s (booking intent, no completion)", sender_id)

    def clear(self, sender_id: str):
        """Remove a sender from follow-up tracking."""
        self._followups.pop(sender_id, None)

    def _has_booking_completed(self, messages: list) -> bool:
        for msg in messages:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc.get("name") == "save_booking":
                        return True
        return False

    def _detect_booking_intent(self, messages: list) -> bool:
        user_texts = []
        has_calendar_check = False

        for msg in messages:
            if isinstance(msg, tuple) and msg[0] == "user":
                user_texts.append(msg[1].lower())
            elif hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    name = tc.get("name", "")
                    if name == "GOOGLECALENDAR_FIND_FREE_SLOTS":
                        has_calendar_check = True

        if has_calendar_check:
            return True

        for text in user_texts:
            if any(kw in text for kw in BOOKING_INTENT_KEYWORDS):
                return True

        return False

    def _get_template(self, stage: int) -> str:
        if stage < len(FOLLOWUP_TEMPLATES):
            return FOLLOWUP_TEMPLATES[stage]
        return ""

    def _send(self, sender_id: str, message: str) -> bool:
        try:
            resp = requests.post(
                f"https://graph.facebook.com/{self._api_version}/me/messages",
                params={"access_token": self._page_access_token},
                json={
                    "recipient": {"id": sender_id},
                    "message": {"text": message},
                },
            )
            logger.info(
                "[followup] Sent to %s (status %s): %s",
                sender_id, resp.status_code, message[:60],
            )
            return resp.status_code == 200
        except Exception as e:
            logger.error("[followup] Send error for %s: %s", sender_id, e)
            return False

    async def run(self):
        """Background loop: check every 15 minutes for pending follow-ups."""
        logger.info("[followup] Background loop started (interval=15min)")
        while True:
            try:
                await self._check()
            except Exception as e:
                logger.error("[followup] Check error: %s", e, exc_info=True)
            await asyncio.sleep(900)

    async def _check(self):
        now = datetime.now()
        to_remove = []

        for sender_id, state in self._followups.items():
            elapsed = (now - state["last_message_time"]).total_seconds()

            if state["stage"] == 0 and not state["first_followup_sent"]:
                if elapsed >= 86400:
                    msg = self._get_template(0)
                    ok = await asyncio.to_thread(self._send, sender_id, msg)
                    if ok:
                        state["first_followup_sent"] = True
                        state["stage"] = 1
                        state["last_message_time"] = now

            elif state["stage"] == 1 and not state["second_followup_sent"]:
                if elapsed >= 86400:
                    msg = self._get_template(1)
                    ok = await asyncio.to_thread(self._send, sender_id, msg)
                    if ok:
                        state["second_followup_sent"] = True
                        state["stage"] = 2
                        to_remove.append(sender_id)

            else:
                to_remove.append(sender_id)

        for sid in to_remove:
            self._followups.pop(sid, None)
