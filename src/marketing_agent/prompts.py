"""Compatibility shim — delegates to modular prompt_parts package.

Kept as a compatibility layer so existing imports continue to work.
After verification, this file can be removed.
"""

from marketing_agent.prompt_parts import MARKETING_SYSTEM  # noqa: F401

__all__ = ["MARKETING_SYSTEM"]
