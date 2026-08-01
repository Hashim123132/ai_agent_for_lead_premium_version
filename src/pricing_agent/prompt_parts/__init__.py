"""Compose the full pricing system prompt from modular parts."""

from .system_prompt import SYSTEM_PROMPT
from .query_guidance import QUERY_GUIDANCE
from .campaign_strategy import CAMPAIGN_STRATEGY
from .output_format import OUTPUT_FORMAT

PRICING_SYSTEM = "\n\n---\n\n".join([
    SYSTEM_PROMPT,
    QUERY_GUIDANCE,
    CAMPAIGN_STRATEGY,
    OUTPUT_FORMAT,
])

__all__ = ["PRICING_SYSTEM"]
