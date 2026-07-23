from datetime import datetime, timedelta, timezone
from typing import Any

from shared.integrations.facebook_client import FacebookClient
from shared.integrations.sheets_client import ensure_headers, get_or_create_worksheet

POSTS_SHEET = "FB Posts"
INSIGHTS_SHEET = "FB Page Insights"

POSTS_HEADERS = [
    "post_id", "message", "created_time", "permalink_url",
    "media_type", "reach", "impressions", "engaged_users",
    "clicks", "reactions", "comments", "shares",
    "reactions_like", "reactions_love", "reactions_wow",
    "reactions_haha", "reactions_sorry", "reactions_anger",
    "updated_at",
]

INSIGHTS_HEADERS = [
    "date", "followers_count", "page_fan_adds", "page_fan_removes",
    "page_impressions", "page_impressions_unique",
    "page_engaged_users", "page_views_total",
]


def _flatten_reactions(breakdown: dict | None) -> dict:
    if not breakdown:
        return {}
    return {
        "reactions_like": breakdown.get("like", 0),
        "reactions_love": breakdown.get("love", 0),
        "reactions_wow": breakdown.get("wow", 0),
        "reactions_haha": breakdown.get("haha", 0),
        "reactions_sorry": breakdown.get("sorry", 0),
        "reactions_anger": breakdown.get("anger", 0),
    }


def _engagement_rate(reach: int | float, engaged: int | float) -> float:
    if not reach:
        return 0.0
    return round((float(engaged) / float(reach)) * 100, 2)


def sync_posts() -> int:
    client = FacebookClient()
    ensure_headers(POSTS_SHEET, POSTS_HEADERS)
    ws = get_or_create_worksheet(POSTS_SHEET)
    existing = ws.get_all_records()
    existing_ids = {r.get("post_id", "") for r in existing if r.get("post_id")}

    posts = client.get_page_posts(limit=100)
    now = datetime.now(timezone.utc).isoformat()
    new_count = 0

    for post in posts:
        pid = post.get("id", "")
        if pid in existing_ids:
            continue
        insights = client.get_post_insights(pid)
        reactions_breakdown = insights.pop("reactions_breakdown", {})
        flat = _flatten_reactions(reactions_breakdown)
        attachments = post.get("attachments", {})
        media_type = "text"
        if attachments:
            media_data = attachments.get("data", [])
            if media_data:
                media_type = media_data[0].get("media_type", "text")

        row = [
            pid,
            post.get("message", ""),
            post.get("created_time", ""),
            post.get("permalink_url", ""),
            media_type,
            insights.get("reach", 0),
            insights.get("impressions", 0),
            insights.get("engaged_users", 0),
            insights.get("clicks", 0),
            insights.get("reactions", 0),
            insights.get("comments", 0),
            insights.get("shares", 0),
            flat.get("reactions_like", 0),
            flat.get("reactions_love", 0),
            flat.get("reactions_wow", 0),
            flat.get("reactions_haha", 0),
            flat.get("reactions_sorry", 0),
            flat.get("reactions_anger", 0),
            now,
        ]
        ws.append_row(row)
        existing_ids.add(pid)
        new_count += 1

    return new_count


def sync_page_insights() -> dict:
    client = FacebookClient()
    ensure_headers(INSIGHTS_SHEET, INSIGHTS_HEADERS)
    ws = get_or_create_worksheet(INSIGHTS_SHEET)
    existing = ws.get_all_records()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    already_today = any(r.get("date", "") == today for r in existing if r.get("date"))

    insights = client.get_page_insights()
    row = [
        today,
        insights.get("followers_count", 0),
        insights.get("page_fan_adds", 0),
        insights.get("page_fan_removes", 0),
        insights.get("page_impressions", 0),
        insights.get("page_impressions_unique", 0),
        insights.get("page_engaged_users", 0),
        insights.get("page_views_total", 0),
    ]

    if already_today:
        last_row = len(existing) + 1
        for col, val in enumerate(row, 1):
            ws.update_cell(last_row, col, val)
    else:
        ws.append_row(row)

    return insights


def get_all_posts() -> list[dict]:
    ws = get_or_create_worksheet(POSTS_SHEET)
    ensure_headers(POSTS_SHEET, POSTS_HEADERS)
    return ws.get_all_records()


def get_page_insights_history(days: int = 30) -> list[dict]:
    ws = get_or_create_worksheet(INSIGHTS_SHEET)
    ensure_headers(INSIGHTS_SHEET, INSIGHTS_HEADERS)
    records = ws.get_all_records()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    return [r for r in records if r.get("date", "") >= cutoff]


def compute_post_summary(posts: list[dict]) -> dict:
    if not posts:
        return {
            "total_posts": 0,
            "top_performers": [],
            "needs_improvement": [],
            "recent_30": [],
            "averages": {},
            "trends": {},
        }

    # compute engagement for sorting
    enriched = []
    for p in posts:
        reach = int(p.get("reach", 0) or 0)
        engaged = int(p.get("engaged_users", 0) or 0)
        impressions = int(p.get("impressions", 0) or 0)
        reactions = int(p.get("reactions", 0) or 0)
        comments = int(p.get("comments", 0) or 0)
        shares = int(p.get("shares", 0) or 0)
        clicks = int(p.get("clicks", 0) or 0)
        total_engagement = engaged or (reactions + comments + shares + clicks)
        er = _engagement_rate(reach, engaged or total_engagement)
        enriched.append({**p, "_engagement": total_engagement, "_engagement_rate": er})

    enriched.sort(key=lambda x: x["_engagement"], reverse=True)

    top_10 = enriched[:10]
    bottom_10 = enriched[-10:] if len(enriched) >= 10 else enriched
    recent_30 = sorted(enriched, key=lambda x: x.get("created_time", ""), reverse=True)[:30]

    all_reach = [int(p.get("reach", 0) or 0) for p in enriched]
    all_impressions = [int(p.get("impressions", 0) or 0) for p in enriched]
    all_engaged = [p["_engagement"] for p in enriched]
    all_er = [p["_engagement_rate"] for p in enriched]

    def avg(vals: list[float]) -> float:
        return round(sum(vals) / len(vals), 2) if vals else 0.0

    media_types: dict[str, list[int]] = {}
    for p in enriched:
        mt = p.get("media_type", "text")
        if mt not in media_types:
            media_types[mt] = []
        media_types[mt].append(p["_engagement"])

    media_performance = {}
    for mt, vals in media_types.items():
        media_performance[mt] = {
            "avg_engagement": avg(vals),
            "count": len(vals),
            "avg_er": avg([p["_engagement_rate"] for p in enriched if p.get("media_type") == mt]),
        }

    return {
        "total_posts": len(enriched),
        "top_performers": [
            {
                "post_id": p.get("post_id", ""),
                "message": (p.get("message", "") or "")[:150],
                "created_time": p.get("created_time", ""),
                "permalink_url": p.get("permalink_url", ""),
                "media_type": p.get("media_type", "text"),
                "reach": int(p.get("reach", 0) or 0),
                "impressions": int(p.get("impressions", 0) or 0),
                "engagement": p["_engagement"],
                "engagement_rate": p["_engagement_rate"],
                "reactions": int(p.get("reactions", 0) or 0),
                "comments": int(p.get("comments", 0) or 0),
                "shares": int(p.get("shares", 0) or 0),
            }
            for p in top_10
        ],
        "needs_improvement": [
            {
                "post_id": p.get("post_id", ""),
                "message": (p.get("message", "") or "")[:150],
                "created_time": p.get("created_time", ""),
                "permalink_url": p.get("permalink_url", ""),
                "media_type": p.get("media_type", "text"),
                "reach": int(p.get("reach", 0) or 0),
                "impressions": int(p.get("impressions", 0) or 0),
                "engagement": p["_engagement"],
                "engagement_rate": p["_engagement_rate"],
                "reactions": int(p.get("reactions", 0) or 0),
                "comments": int(p.get("comments", 0) or 0),
                "shares": int(p.get("shares", 0) or 0),
            }
            for p in bottom_10
        ],
        "recent_posts": [
            {
                "post_id": p.get("post_id", ""),
                "message": (p.get("message", "") or "")[:150],
                "created_time": p.get("created_time", ""),
                "permalink_url": p.get("permalink_url", ""),
                "media_type": p.get("media_type", "text"),
                "reach": int(p.get("reach", 0) or 0),
                "impressions": int(p.get("impressions", 0) or 0),
                "engagement": p["_engagement"],
                "engagement_rate": p["_engagement_rate"],
            }
            for p in recent_30
        ],
        "averages": {
            "avg_reach": avg(all_reach),
            "avg_impressions": avg(all_impressions),
            "avg_engagement": avg(all_engaged),
            "avg_engagement_rate": avg(all_er),
        },
        "media_performance": media_performance,
    }
