"""Compose the full lead gen system prompt from modular parts."""

from .system_prompt import SYSTEM_PROMPT
from .output_format import OUTPUT_FORMAT

LEAD_GEN_SYSTEM = "\n\n---\n\n".join([
    SYSTEM_PROMPT,
    OUTPUT_FORMAT,
])

__all__ = ["LEAD_GEN_SYSTEM"]
