"""Compatibility shim — delegates to modular prompt_parts package."""

from pricing_agent.prompt_parts import PRICING_SYSTEM  # noqa: F401

__all__ = ["PRICING_SYSTEM"]
