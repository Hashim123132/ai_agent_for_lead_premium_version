"""Tools for the marketing agent."""

from marketing_agent.tools.campaign_export import save_campaign_draft
from marketing_agent.tools.competitor_ads import search_competitor_ads
from marketing_agent.tools.market_trends import search_market_trends

__all__ = [
    "search_competitor_ads",
    "search_market_trends",
    "save_campaign_draft",
]
