"""FastAPI server for Facebook Messenger webhook + admin API."""

import asyncio
import json
import logging
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import requests

from booking_agent import booking_agent_graph
from booking_agent.followup import FollowupManager
from lead_gen_agent import lead_gen_agent_graph
from marketing_agent import marketing_agent_graph
from pricing_agent import pricing_agent_graph
from shared.ad_suggestions import analyze_ads, search_relevant_ads
from shared.business_profile import format_profile_for_prompt, get_profile, update_profile
from shared.campaign_service import approve_campaign, evaluate_campaign, get_active_campaign, list_campaigns, reject_campaign, save_campaign
from shared.integrations.sheets_client import get_all_records
from shared.metrics_service import get_metrics_range, save_daily_metrics
from shared.facebook_insights_service import (
    compute_post_summary,
    get_all_posts,
    get_page_insights_history,
    sync_page_insights,
    sync_posts,
)
from shared.facebook_analysis import analyze_posts, generate_caption
from shared.integrations.facebook_client import FacebookClient

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

followup_manager = FollowupManager(
    page_access_token=PAGE_ACCESS_TOKEN,
    api_version=API_VERSION,
) if PAGE_ACCESS_TOKEN else None

conversations: dict[str, list] = defaultdict(list)

PROGRESS_LABELS = {
    "get_booking_metrics": "Fetching booking data...",
    "analyze_past_campaigns": "Learning from past campaigns...",
    "search_relevant_ads": "Analyzing relevant ads...",
    "search_market_trends": "Analyzing market trends...",
    "get_car_inventory": "Analyzing inventory & pricing...",
    "search_business_leads": "Searching for leads...",
    "save_lead": "Saving lead to CRM...",
    "save_campaign_draft": "Finalizing campaign draft...",
}


def _extract_section(text: str, section_name: str, next_section_pattern: str) -> str | None:
    pattern = rf'{re.escape(section_name)}\s*\n(.*?)(?=\n\s*(?:{next_section_pattern})\s*\n|\Z)'
    m = re.search(pattern, text, re.DOTALL)
    return m.group(1) if m else None


def _parse_qualified_lead_block(block: str) -> dict | None:
    lines = block.strip().split('\n')
    if not lines:
        return None
    first = lines[0].strip()
    m = re.match(r'\d+\.\s+(.+?)\s+\((.+?)\)\s*—\s*Score:\s*(\d+)/100', first)
    if not m:
        return None
    lead: dict = {
        'business_name': m.group(1).strip(),
        'lead_type': m.group(2).strip(),
        'score': int(m.group(3)),
        'contact_info': '',
        'status': 'Qualified',
        'notes': '',
        'source': '',
    }
    in_draft = False
    draft_lines: list[str] = []
    for line in lines[1:]:
        s = line.strip()
        if not s:
            if in_draft:
                draft_lines.append('')
            continue
        if s.startswith('Source:'):
            lead['source'] = s.replace('Source:', '', 1).strip()
        elif s.startswith('Contact:'):
            lead['contact_info'] = s.replace('Contact:', '', 1).strip()
        elif s.startswith('Status:'):
            lead['status'] = s.replace('Status:', '', 1).strip()
        elif s.startswith('Outreach Draft:'):
            in_draft = True
        elif in_draft:
            draft_lines.append(s)
    if draft_lines:
        lead['notes'] = '\n'.join(draft_lines)
    return lead


def _parse_leads_from_text(text: str) -> list[dict]:
    leads: list[dict] = []
    qualified = _extract_section(text, 'Qualified Leads', r'(?:Cold Leads|Summary)')
    if qualified:
        blocks = re.split(r'\n(?=\d+\.\s)', qualified.strip())
        for block in blocks:
            lead = _parse_qualified_lead_block(block)
            if lead:
                leads.append(lead)
    cold = _extract_section(text, 'Cold Leads', r'Summary')
    if cold:
        for line in cold.strip().split('\n'):
            line = line.strip()
            m = re.match(
                r'[•\-]\s*(.+?)\s+\((.+?)\)\s*—\s*Score:\s*(\d+)/100\s*—\s*Reason:\s*(.+)',
                line,
            )
            if m:
                leads.append({
                    'business_name': m.group(1).strip(),
                    'lead_type': m.group(2).strip(),
                    'score': int(m.group(3)),
                    'notes': m.group(4).strip(),
                    'contact_info': '',
                    'status': 'Cold Lead',
                })
    return leads


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
        result = await booking_agent_graph.ainvoke(state)
        logger.info("[%s] Graph finished", sender_id)

        new_messages = result.get("messages", [])
        conversations[sender_id] = list(new_messages)
        logger.info("[%s] History updated (%s messages)", sender_id, len(new_messages))

        if followup_manager:
            followup_manager.track(sender_id, new_messages)

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

    profile = get_profile()
    profile_context = format_profile_for_prompt(profile)
    enriched_prompt = f"{profile_context}\n\nCAMPAIGN REQUEST:\n{prompt}" if profile_context else prompt

    logger.info("Marketing agent invoked with prompt: %s | market: %s, %s", prompt[:100], city, country)

    async def event_stream():
        state = {
            "messages": [("user", enriched_prompt)],
            "market": {"city": city or profile.get("city", ""), "country": country or profile.get("country", "")},
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


@app.post("/pricing/generate")
async def run_pricing(request: Request):
    """Stream pricing agent execution with real-time progress via SSE."""
    body = await request.json()
    market = body.get("market", {})
    city = market.get("city", "")
    country = market.get("country", "")

    logger.info("Pricing agent invoked | market: %s, %s", city, country)

    async def event_stream():
        state = {
            "messages": [
                ("user", f"Analyze current pricing for {city}, {country}. Generate pricing recommendations.")
            ],
            "market": {"city": city, "country": country},
        }

        try:
            final_messages = None

            async for event in pricing_agent_graph.astream_events(state, version="v2"):
                kind = event["event"]
                name = event.get("name", "")

                if kind == "on_tool_start" and name in PROGRESS_LABELS:
                    msg = json.dumps({"type": "progress", "message": PROGRESS_LABELS[name]})
                    yield f"data: {msg}\n\n"

                if kind == "on_chat_model_start":
                    msg = json.dumps({"type": "progress", "message": "Generating pricing strategy..."})
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

            result = json.dumps({
                "type": "result",
                "status": "ok",
                "response": response_text,
            })
            yield f"data: {result}\n\n"

        except Exception as e:
            logger.error("Pricing agent error: %s", e, exc_info=True)
            err = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {err}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/leads/generate")
async def run_lead_gen(request: Request):
    """Stream lead generation agent execution with real-time progress via SSE."""
    body = await request.json()
    market = body.get("market", {})
    city = market.get("city", "")
    country = market.get("country", "")
    query = body.get("query", "")

    logger.info("Lead gen agent invoked | market: %s, %s | query: %s", city, country, query[:100])

    async def event_stream():
        user_msg = f"Find business partners in {city}, {country}." if not query else query
        state = {
            "messages": [("user", user_msg)],
            "market": {"city": city, "country": country},
        }

        try:
            final_messages = None
            pending_leads: dict[str, dict] = {}

            async for event in lead_gen_agent_graph.astream_events(state, version="v2"):
                kind = event["event"]
                name = event.get("name", "")
                run_id = event.get("run_id", "")

                if kind == "on_tool_start" and name in PROGRESS_LABELS:
                    msg = json.dumps({"type": "progress", "message": PROGRESS_LABELS[name]})
                    yield f"data: {msg}\n\n"

                if kind == "on_tool_start" and name == "save_lead":
                    pending_leads[run_id] = event["data"].get("input", {})

                if kind == "on_tool_end" and name == "save_lead":
                    input_data = pending_leads.pop(run_id, None)
                    if input_data:
                        lead = {
                            "business_name": input_data.get("business_name", ""),
                            "lead_type": input_data.get("lead_type", ""),
                            "contact_info": input_data.get("contact_info", ""),
                            "score": input_data.get("score", 0),
                            "notes": input_data.get("notes", ""),
                            "outreach_draft": input_data.get("outreach_draft", ""),
                            "source": input_data.get("source", ""),
                            "status": "New",
                        }
                        yield f"data: {json.dumps({'type': 'lead', 'lead': lead})}\n\n"

                if kind == "on_chat_model_start":
                    msg = json.dumps({"type": "progress", "message": "Generating lead strategy..."})
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

            parsed = _parse_leads_from_text(response_text)
            if parsed:
                yield f"data: {json.dumps({'type': 'leads', 'leads': parsed})}\n\n"

            result = json.dumps({
                "type": "result",
                "status": "ok",
                "response": response_text,
            })
            yield f"data: {result}\n\n"

        except Exception as e:
            logger.error("Lead gen agent error: %s", e, exc_info=True)
            err = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {err}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/leads/save")
async def save_lead_api(request: Request):
    """Save a single lead to the CRM sheet."""
    body = await request.json()
    try:
        from lead_gen_agent.tools.leads_crm import LEADS_HEADERS, SHEET_NAME
        from shared.integrations.sheets_client import append_row, ensure_headers
        ensure_headers(SHEET_NAME, LEADS_HEADERS)
        append_row(SHEET_NAME, [
            body.get("business_name", ""),
            body.get("lead_type", body.get("type", "")),
            body.get("source", ""),
            body.get("city", ""),
            body.get("country", ""),
            body.get("contact_info", ""),
            str(body.get("score", 0)),
            body.get("status", "New"),
            body.get("notes", ""),
            body.get("outreach_draft", ""),
            datetime.now().isoformat(),
        ])
        return {"status": "ok", "business_name": body.get("business_name", "")}
    except Exception as e:
        logger.error("Error saving lead: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/campaign/approve")
async def approve(request: Request):
    body = await request.json()
    campaign_id = body.get("campaign_id", "")
    if not campaign_id:
        return {"status": "error", "error": "campaign_id is required"}
    result = approve_campaign(campaign_id)
    return result


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


@app.get("/campaign/active")
async def active_campaign():
    try:
        active = get_active_campaign()
        if active:
            return {"status": "ok", "campaign": active}
        return {"status": "ok", "campaign": None}
    except Exception as e:
        logger.error("Error fetching active campaign: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


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


@app.post("/metrics/snapshot")
async def metrics_snapshot(request: Request):
    body = await request.json()
    campaign_id = body.get("campaign_id", "")
    try:
        snapshot = save_daily_metrics(active_campaign_id=campaign_id, force=True)
        return {"status": "ok", "snapshot": snapshot}
    except Exception as e:
        logger.error("Error saving metrics snapshot: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.get("/metrics/history")
async def metrics_history(request: Request):
    start_date = request.query_params.get("start_date", "")
    end_date = request.query_params.get("end_date", "")
    try:
        records = get_metrics_range(start_date, end_date)
        return {"status": "ok", "metrics": records}
    except Exception as e:
        logger.error("Error fetching metrics history: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.get("/business-profile")
async def business_profile_get():
    try:
        profile = get_profile()
        return {"status": "ok", "profile": profile}
    except Exception as e:
        logger.error("Error reading business profile: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.put("/business-profile")
async def business_profile_put(request: Request):
    try:
        body = await request.json()
        profile = update_profile(body)
        return {"status": "ok", "profile": profile}
    except Exception as e:
        logger.error("Error updating business profile: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/ad-suggestions/search")
async def ad_suggestions_search(request: Request):
    """Search relevant ad images + AI pattern analysis via SSE."""
    body = await request.json()
    profile = get_profile()
    country = body.get("country", "") or profile.get("country", "")
    city = body.get("city", "") or profile.get("city", "")
    goal = body.get("goal", "") or profile.get("business_goals", "")
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
            ads = await search_relevant_ads(mode, city, country, goal)
            yield f"data: {json.dumps({'type': 'ads', 'ads': ads})}\n\n"

            analysis = await analyze_ads(ads, mode, city, country, goal, profile=profile)
            yield f"data: {json.dumps({'type': 'analysis', 'analysis': analysis})}\n\n"

        except Exception as e:
            logger.error("Ad suggestions error: %s", e, exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Facebook Page Insights & Posting
# ---------------------------------------------------------------------------


@app.post("/facebook/sync")
async def fb_sync():
    try:
        post_count = sync_posts()
        insights = sync_page_insights()
        return {"status": "ok", "new_posts": post_count, "insights": insights}
    except Exception as e:
        logger.error("Facebook sync error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.get("/facebook/posts")
async def fb_posts():
    try:
        posts = get_all_posts()
        summary = compute_post_summary(posts)
        return {"status": "ok", **summary}
    except Exception as e:
        logger.error("Facebook posts error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.get("/facebook/insights")
async def fb_insights(days: int = 30):
    try:
        history = get_page_insights_history(days=days)
        return {"status": "ok", "history": history}
    except Exception as e:
        logger.error("Facebook insights error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/facebook/analyze")
async def fb_analyze():
    try:
        analysis = analyze_posts()
        return {"status": "ok", **analysis}
    except Exception as e:
        logger.error("Facebook analysis error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/facebook/generate-caption")
async def fb_generate_caption(request: Request):
    try:
        body = await request.json()
        goal = body.get("goal", "Promote our car rental services")
        tone = body.get("tone", "Professional")
        result = generate_caption(goal, tone)
        return {"status": "ok", **result}
    except Exception as e:
        logger.error("Facebook caption error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.post("/facebook/publish")
async def fb_publish(
    message: str = Form(...),
    image: UploadFile | None = File(default=None),
):
    try:
        if not message.strip():
            return {"status": "error", "error": "Message is required"}
        client = FacebookClient()
        if image and image.file:
            image_bytes = await image.read()
            result = client.create_post_with_image_bytes(message, image_bytes, image.filename or "image.jpg")
        else:
            result = client.create_post(message)
        return {"status": "ok", "post_id": result.get("id", "")}
    except Exception as e:
        logger.error("Facebook publish error: %s", e, exc_info=True)
        return {"status": "error", "error": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok", "agent": booking_agent_graph.name}


@app.on_event("startup")
async def start_followup_loop():
    if followup_manager:
        asyncio.create_task(followup_manager.run())
