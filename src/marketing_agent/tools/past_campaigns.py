"""Tool to analyze past high-scoring campaigns for actionable insights."""

import time
from collections import Counter

from langchain_core.tools import tool

from shared.integrations.sheets_client import get_all_records

MIN_SCORE = 8

CACHE_TTL = 300

_cache: str | None = None
_cache_ts: float = 0


def clear_past_campaigns_cache() -> None:
    """Invalidate the cached past campaigns analysis."""
    global _cache, _cache_ts
    _cache = None
    _cache_ts = 0


@tool
def analyze_past_campaigns() -> str:
    """Analyze past campaigns with result_score >= 8 and return patterns.

    Extracts top offers, best audiences, and budget ranges from
    historically successful campaigns to inform future recommendations.

    Results are cached for 5 minutes to reduce Google Sheets reads.
    """
    global _cache, _cache_ts

    now = time.time()
    if _cache is not None and now - _cache_ts < CACHE_TTL:
        return _cache

    try:
        records = get_all_records("Campaign Drafts")
    except Exception as e:
        return f"[TOOL STATUS] source=past_campaigns status=UNAVAILABLE reason=SERVICE_ERROR message={e!s}"

    high_scorers = [
        r
        for r in records
        if r.get("campaign_id")
        and r.get("result_score", "").strip()
        and r.get("status", "").strip() == "Approved"
    ]

    scored = []
    for r in high_scorers:
        try:
            score = int(r["result_score"])
            if score >= MIN_SCORE:
                scored.append((score, r))
        except (ValueError, TypeError):
            continue

    if not scored:
        result = (
            "No past campaigns with a score of 8 or higher found. "
            "Proceed with standard market data — no historical patterns available."
        )
        _cache = result
        _cache_ts = time.time()
        return result

    scored.sort(key=lambda x: -x[0])

    top_offers = Counter()
    top_audiences = Counter()
    budgets = []

    for score, row in scored:
        offer = (row.get("suggested_offer", "") or "").strip()
        audience = (row.get("audience", "") or "").strip()
        budget_raw = (row.get("budget", "") or "").strip()

        if offer:
            top_offers[offer] += 1
        if audience:
            top_audiences[audience] += 1
        if budget_raw:
            budgets.append(budget_raw)

    lines = ["Past High-Scoring Campaign Analysis:", ""]

    lines.append(f"Campaigns evaluated: {len(scored)} (score >= {MIN_SCORE})")
    best = scored[0]
    lines.append(f"Top scorer: {best[1].get('suggested_offer', 'N/A')} — {best[0]}/10")
    lines.append("")

    if top_offers:
        lines.append("Best-performing offers:")
        for offer, count in top_offers.most_common(3):
            lines.append(f"  - {offer} (used in {count} successful campaign(s))")
        lines.append("")

    if top_audiences:
        lines.append("Best-performing audiences:")
        for audience, count in top_audiences.most_common(3):
            lines.append(f"  - {audience} (used in {count} successful campaign(s))")
        lines.append("")

    if budgets:
        lines.append("Budget range from successful campaigns:")
        lines.append(f"  - {budgets[0]} (highest-scoring campaign)")
        if len(budgets) > 1:
            lines.append(f"  - Range: {', '.join(budgets[:5])}")
        lines.append("")

    lines.append("Recommendation: Consider similar strategies to these proven approaches,")
    lines.append("while adapting messaging and offers to current market conditions.")

    result = "\n".join(lines)
    _cache = result
    _cache_ts = time.time()
    return result
