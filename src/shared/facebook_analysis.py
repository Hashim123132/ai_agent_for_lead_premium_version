import json
import os
from typing import Any

from shared.facebook_insights_service import compute_post_summary, get_all_posts, get_page_insights_history

try:
    from mistralai import Mistral

    _client: Mistral | None = Mistral(api_key=os.getenv("MISTRAL_API_KEY", ""))
except Exception:
    _client = None


def _get_client() -> Any:
    if _client is None:
        raise RuntimeError("Mistral AI client not available. Set MISTRAL_API_KEY.")
    return _client


ANALYSIS_PROMPT = """You are a social media analytics expert. Analyze the provided Facebook Page post summary and produce an evidence-based report.

## DATA YOU RECEIVE
You will receive:
- Total post count
- Top 10 performers (highest engagement)
- Bottom 10 performers (lowest engagement / needs improvement)
- Recent 30 posts
- Overall averages (avg_reach, avg_impressions, avg_engagement, avg_engagement_rate)
- Media type performance breakdown

## RULES
1. ONLY make claims supported by the data provided. If the data doesn't explain something, say so.
2. Compare each top/bottom post against the averages explicitly (e.g., "Reach was 68% below your average of X").
3. Identify patterns in top performers vs bottom performers (media type, message length, posting time if available).
4. Suggest concrete, actionable improvements.
5. DO NOT invent reasons. DO NOT guess. If insufficient data exists to draw a conclusion, state that clearly.

## OUTPUT FORMAT
Return valid JSON with this exact structure:
{
  "best_posting_times": "string or null",
  "best_content_types": "string describing which media types perform best with data",
  "key_findings": "string - 2-3 paragraphs of evidence-based findings",
  "recommendations": ["string - actionable recommendation 1", "string - recommendation 2", "string - recommendation 3"],
  "trend_summary": "string - 1 paragraph summary of overall performance trends"
}

Do NOT include any text outside the JSON. Only return the JSON object."""


def analyze_posts() -> dict:
    posts = get_all_posts()
    summary = compute_post_summary(posts)
    insights_history = get_page_insights_history(days=30)

    payload = {
        "total_posts": summary["total_posts"],
        "top_performers_count": len(summary["top_performers"]),
        "top_performers": summary["top_performers"][:5],
        "needs_improvement_count": len(summary["needs_improvement"]),
        "needs_improvement": summary["needs_improvement"][:5],
        "averages": summary["averages"],
        "media_performance": summary["media_performance"],
        "recent_posts_count": len(summary["recent_posts"]),
        "page_insights_30d": insights_history[-7:] if insights_history else [],
    }

    client = _get_client()
    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": ANALYSIS_PROMPT},
            {"role": "user", "content": json.dumps(payload, indent=2)},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    content = response.choices[0].message.content
    result = json.loads(content)

    # fallback defaults for null values
    if not result.get("best_posting_times"):
        result["best_posting_times"] = "Insufficient data to determine optimal posting times."
    if not result.get("best_content_types"):
        result["best_content_types"] = "Insufficient data to determine best content types."
    if not result.get("trend_summary"):
        result["trend_summary"] = "Insufficient data to identify trends."

    return {
        **result,
        "top_performers": summary["top_performers"],
        "needs_improvement": summary["needs_improvement"],
        "recent_posts": summary["recent_posts"],
        "averages": summary["averages"],
    }


CAPTION_PROMPT = """You are a social media copywriter for a car rental business. Generate a Facebook post caption.

Given the goal and tone, produce a compelling caption that:
- Is 1-3 short paragraphs
- Includes a clear call-to-action
- Uses emojis sparingly and naturally
- Is ready to publish

Return ONLY a JSON object: {"caption": "the caption text", "hashtags": ["tag1", "tag2", "tag3"]}"""


def generate_caption(goal: str, tone: str = "Professional") -> dict:
    client = _get_client()
    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": CAPTION_PROMPT},
            {
                "role": "user",
                "content": f"Goal: {goal}\nTone: {tone}\nBusiness: Car rental company with SUVs, sedans, luxury, and economy vehicles.",
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    content = response.choices[0].message.content
    return json.loads(content)
