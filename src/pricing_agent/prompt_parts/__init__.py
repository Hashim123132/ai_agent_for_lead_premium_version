"""Compose the full pricing system prompt from modular parts."""

from .system_prompt import SYSTEM_PROMPT
from .campaign_strategy import CAMPAIGN_STRATEGY
from .output_format import OUTPUT_FORMAT

PRICING_SYSTEM = "\n\n---\n\n".join([
    SYSTEM_PROMPT,
    CAMPAIGN_STRATEGY,
    OUTPUT_FORMAT,
])

__all__ = ["PRICING_SYSTEM"]
