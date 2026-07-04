"""Tools for the marketing agent."""

from marketing_agent.tools.campaign_export import save_campaign_draft
from marketing_agent.tools.past_campaigns import analyze_past_campaigns
from marketing_agent.tools.relevant_ads import search_relevant_ads
from marketing_agent.tools.market_trends import search_market_trends

__all__ = [
    "search_relevant_ads",
    "search_market_trends",
    "save_campaign_draft",
    "analyze_past_campaigns",
]
