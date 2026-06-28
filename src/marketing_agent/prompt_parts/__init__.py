"""Compose the full marketing system prompt from modular parts."""

from .system_prompt import SYSTEM_PROMPT
from .evidence_rules import EVIDENCE_RULES
from .anti_hallucination import ANTI_HALLUCINATION
from .campaign_strategy import CAMPAIGN_STRATEGY
from .expected_outcome import EXPECTED_OUTCOME
from .confidence_rules import CONFIDENCE_RULES
from .output_format import OUTPUT_FORMAT

MARKETING_SYSTEM = "\n\n---\n\n".join([
    SYSTEM_PROMPT,
    EVIDENCE_RULES,
    ANTI_HALLUCINATION,
    CAMPAIGN_STRATEGY,
    EXPECTED_OUTCOME,
    CONFIDENCE_RULES,
    OUTPUT_FORMAT,
])

__all__ = ["MARKETING_SYSTEM"]
