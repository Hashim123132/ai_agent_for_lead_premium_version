"""FastAPI server for Facebook Messenger webhook + admin API."""

import asyncio
import json
import logging
import os
from collections import defaultdict
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import requests

from appointment_agent import appointment_agent_graph
from marketing_agent import marketing_agent_graph
from shared.ad_suggestions import analyze_ads, search_competitor_ads
from shared.campaign_service import approve_campaign, evaluate_campaign, list_campaigns, reject_campaign, save_campaign
from shared.integrations.sheets_client import get_all_records

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN", "hashim_webhook_123")
PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN")
API_VERSION = "v18.0"

conversations: dict[str, list] = defaultdict(list)

PROGRESS_LABELS = {
    "get_booking_metrics": "Fetching booking data...",
    "search_competitor_ads": "Analyzing competitor ads...",
    "search_market_trends": "Analyzing market trends...",
    "save_campaign_draft": "Finalizing campaign draft...",
}


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


@app.post("/marketing/generate")
async def run_marketing(request: Request):
    """Stream marketing agent execution with real-time progress via SSE."""
    body = await request.json()
    prompt = body.get("prompt", "Analyze our current data and suggest a campaign for next weekend.")
    market = body.get("market", {})
    city = market.get("city", "")
    country = market.get("country", "")

    logger.info("Marketing agent invoked with prompt: %s | market: %s, %s", prompt[:100], city, country)

    async def event_stream():
        state = {
            "messages": [("user", prompt)],
            "market": {"city": city, "country": country},
        }

        try:
            final_messages = None

            async for event in marketing_agent_graph.astream_events(state, version="v2"):
                kind = event["event"]
                name = event.get("name", "")

                if kind == "on_tool_start" and name in PROGRESS_LABELS:
                    msg = json.dumps({"type": "progress", "message": PROGRESS_LABELS[name]})
                    yield f"data: {msg}\n\n"

                if kind == "on_chat_model_start":
                    msg = json.dumps({"type": "progress", "message": "Generating campaign strategy..."})
                    yield f"data: {msg}\n\n"

                if kind == "on_chain_end":
                    output = event["data"].get("output", {})
                    if isinstance(output, dict) and "messages" in output:
                        final_messages = output["messages"]

            if not final_messages:
                msg = json.dumps({"type": "error", "error": "No messages returned from graph."})
                yield f"data: {msg}\n\n"
                return

            response_text = None
            for m in reversed(final_messages):
                if hasattr(m, "content") and m.content and not getattr(m, "tool_calls", None):
                    response_text = m.content
                    break

            if not response_text:
                msg = json.dumps({"type": "error", "error": "No text response generated."})
                yield f"data: {msg}\n\n"
                return

            campaign_id = save_campaign(prompt, response_text, city=city, country=country)
            result = json.dumps({
                "type": "result",
                "status": "ok",
                "response": response_text,
                "campaign_id": campaign_id,
            })
            yield f"data: {result}\n\n"

        except Exception as e:
            logger.error("Marketing agent error: %s", e, exc_info=True)
            err = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {err}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/campaign/approve")
async def approve(request: Request):
    body = await request.json()
    campaign_id = body.get("campaign_id", "")
    if not campaign_id:
        return {"status": "error", "error": "campaign_id is required"}
    ok = approve_campaign(campaign_id)
    if ok:
        return {"status": "ok"}
    return {"status": "error", "error": "Campaign not found"}


@app.post("/campaign/reject")
async def reject(request: Request):
    body = await request.json()
    campaign_id = body.get("campaign_id", "")
    if not campaign_id:
        return {"status": "error", "error": "campaign_id is required"}
    ok = reject_campaign(campaign_id)
    if ok:
        return {"status": "ok"}
    return {"status": "error", "error": "Campaign not found"}


@app.post("/campaign/evaluate")
async def evaluate(request: Request):
    body = await request.json()
    campaign_id = body.get("campaign_id", "")
    if not campaign_id:
        return {"status": "error", "error": "campaign_id is required"}
    window_days = body.get("window_days", 7)
    result = evaluate_campaign(campaign_id, window_days=window_days)
    return result


@app.get("/campaigns")
async def campaigns():
    try:
        records = list_campaigns()
        return {"status": "ok", "campaigns": records}
    except Exception as e:
        logger.error("Error listing campaigns: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.get("/metrics")
async def metrics():
    try:
        cars = get_all_records("Cars")
        bookings = get_all_records("Bookings")

        total_cars = len(cars)
        unavailable = sum(
            1 for c in cars if str(c.get("Status", "")).strip().lower() == "unavailable"
        )
        occupancy_rate = round(unavailable / total_cars * 100, 1) if total_cars else 0

        total_bookings = len(bookings)

        car_counts = {}
        for b in bookings:
            car = str(b.get("car", b.get("Car", ""))).strip()
            if car:
                car_counts[car] = car_counts.get(car, 0) + 1

        popular = sorted(car_counts.items(), key=lambda x: -x[1])[:3]

        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent = 0
        for b in bookings:
            raw_date = b.get("booking_date", b.get("Booking Date", ""))
            if raw_date:
                try:
                    dt = datetime.fromisoformat(str(raw_date).replace("Z", ""))
                    if dt > thirty_days_ago:
                        recent += 1
                except (ValueError, TypeError):
                    pass

        return {
            "status": "ok",
            "metrics": {
                "totalCars": total_cars,
                "availableCars": total_cars - unavailable,
                "occupancyRate": occupancy_rate,
                "totalBookings": total_bookings,
                "recentBookings": recent,
                "popularCars": [{"name": name, "count": count} for name, count in popular],
            },
        }
    except Exception as e:
        logger.error("Error fetching metrics: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/ad-suggestions/search")
async def ad_suggestions_search(request: Request):
    """Search competitor ad images + AI pattern analysis via SSE."""
    body = await request.json()
    country = body.get("country", "")
    city = body.get("city", "")
    goal = body.get("goal", "")
    mode = body.get("mode", "web")

    logger.info(
        "Ad suggestions search: mode=%s city=%s country=%s goal=%s",
        mode,
        city,
        country,
        goal,
    )

    async def event_stream():
        try:
            ads = await search_competitor_ads(mode, city, country, goal)
            yield f"data: {json.dumps({'type': 'ads', 'ads': ads})}\n\n"

            analysis = await analyze_ads(ads, mode, city, country, goal)
            yield f"data: {json.dumps({'type': 'analysis', 'analysis': analysis})}\n\n"

        except Exception as e:
            logger.error("Ad suggestions error: %s", e, exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok", "agent": appointment_agent_graph.name}
