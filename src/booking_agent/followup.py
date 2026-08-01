"""Follow-up manager for ghosted booking conversations.

State is persisted in the "FollowUps" tab of Google Sheets so that the
check can run from a scheduled job (e.g. Google Cloud Scheduler) instead
of a long-running background loop.
"""

import asyncio
import logging
import threading
import time
from datetime import datetime

import requests

from shared.integrations.sheets_client import ensure_headers, get_or_create_worksheet

logger = logging.getLogger(__name__)

SHEET_NAME = "FollowUps"
FOLLOWUP_HEADERS = [
    "sender_id",
    "stage",
    "last_message_time",
    "first_followup_sent",
    "second_followup_sent",
]

BOOKING_INTENT_KEYWORDS = [
    "rent",
    "book",
    "want",
    "how much",
    "price",
    "available",
    "need a car",
    "looking for",
    "interested",
    "cost",
    "i need",
    "i want",
    "can i",
    "would like",
]

FOLLOWUP_TEMPLATES = [
    "Hi there! I noticed you were interested in renting a car from Hashim Car Rentals. Would you like any help choosing a vehicle or have any questions? Feel free to reach out anytime! 🚗",
    "Hello again! Just checking in — are you still looking for a car rental? We have some great options available. Let me know if you'd like to discuss further! 😊",
]


def _get_worksheet():
    ws = get_or_create_worksheet(SHEET_NAME, rows=100, cols=len(FOLLOWUP_HEADERS))
    ensure_headers(SHEET_NAME, FOLLOWUP_HEADERS)
    return ws


def _row_to_state(row: list[str]) -> dict | None:
    if not row or not row[0]:
        return None
    try:
        last_ts = int(row[2])
    except ValueError:
        last_ts = int(datetime.fromisoformat(row[2]).timestamp())
    try:
        return {
            "sender_id": row[0],
            "stage": int(row[1]) if row[1].isdigit() else 0,
            "last_message_time": datetime.fromtimestamp(last_ts),
            "first_followup_sent": row[3].strip().lower() == "true"
            if len(row) > 3
            else False,
            "second_followup_sent": row[4].strip().lower() == "true"
            if len(row) > 4
            else False,
        }
    except ValueError:
        logger.warning("[followup] Skipping malformed row: %s", row)
        return None


class FollowupManager:
    """Tracks conversations with booking intent and sends template-based follow-ups.

    No LLM is used — templates are hardcoded.
    Max 2 follow-ups per conversation, 24h delay before the first one.
    State is persisted in the FollowUps Google Sheet.
    """

    def __init__(self, page_access_token: str, api_version: str = "v18.0"):
        """Initialize the follow-up manager."""
        self._page_access_token = page_access_token
        self._api_version = api_version
        self._lock = threading.Lock()

    def _find_row(self, ws, sender_id: str) -> int | None:
        sender_ids = ws.col_values(1)
        for idx, val in enumerate(sender_ids):
            if val == sender_id:
                return idx + 1
        return None

    def track(self, sender_id: str, messages: list):
        """Analyze a finished conversation and start follow-up tracking if needed.

        Call this after the graph finishes processing a message.
        """
        ws = _get_worksheet()
        existing_row = self._find_row(ws, sender_id)

        if existing_row is not None:
            if self._has_booking_completed(messages):
                self.clear(sender_id)
            else:
                ws.update_cell(existing_row, 3, str(int(time.time())))
            return

        if self._has_booking_completed(messages):
            return

        if not self._detect_booking_intent(messages):
            return

        ws.append_row([sender_id, "0", str(int(time.time())), "False", "False"])
        logger.info("[followup] Tracking %s (booking intent, no completion)", sender_id)

    def clear(self, sender_id: str):
        """Remove a sender from follow-up tracking."""
        ws = _get_worksheet()
        row = self._find_row(ws, sender_id)
        if row is not None:
            ws.delete_rows(row)
            logger.info("[followup] Cleared %s", sender_id)

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
                sender_id,
                resp.status_code,
                message[:60],
            )
            return resp.status_code == 200
        except Exception as e:
            logger.error("[followup] Send error for %s: %s", sender_id, e)
            return False

    def check_once(self) -> dict:
        """Run a single follow-up check pass and return a summary.

        Safe to call from the background loop or a scheduler endpoint.
        """
        with self._lock:
            ws = _get_worksheet()
            rows = ws.get_all_values()
            now_ts = time.time()
            sent = 0
            removed = 0
            to_remove: list[int] = []

            for i, row in enumerate(rows):
                if i == 0:
                    continue
                state = _row_to_state(row)
                if state is None:
                    continue

                row_num = i + 1
                elapsed = now_ts - state["last_message_time"].timestamp()

                if state["stage"] == 0 and not state["first_followup_sent"]:
                    if elapsed >= 86400:
                        ok = self._send(state["sender_id"], self._get_template(0))
                        if ok:
                            ws.update_cell(row_num, 2, "1")
                            ws.update_cell(row_num, 3, str(int(now_ts)))
                            ws.update_cell(row_num, 4, "True")
                            sent += 1
                elif state["stage"] == 1 and not state["second_followup_sent"]:
                    if elapsed >= 86400:
                        ok = self._send(state["sender_id"], self._get_template(1))
                        if ok:
                            ws.update_cell(row_num, 5, "True")
                            ws.update_cell(row_num, 3, str(int(now_ts)))
                            to_remove.append(row_num)
                            sent += 1
                elif state["stage"] >= 2:
                    to_remove.append(row_num)

            for row_num in reversed(to_remove):
                ws.delete_rows(row_num)
                removed += 1

            logger.info(
                "[followup] Check complete: tracked=%s, sent=%s, removed=%s",
                len(rows) - 1 - removed,
                sent,
                removed,
            )
            return {"checked": len(rows) - 1, "sent": sent, "removed": removed}

    async def run(self):
        """Background loop: check every 15 minutes for pending follow-ups.

        State is persisted in the FollowUps sheet, so restarts/redeploys are
        safe and overdue sends are picked up on the next check.
        """
        logger.info("[followup] Background loop started (interval=15min)")
        while True:
            try:
                await asyncio.to_thread(self.check_once)
            except Exception as e:
                logger.error("[followup] Check error: %s", e, exc_info=True)
            await asyncio.sleep(900)
