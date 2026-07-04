"""Compatibility shim — delegates to modular prompt_parts package."""

from lead_gen_agent.prompt_parts import LEAD_GEN_SYSTEM  # noqa: F401

__all__ = ["LEAD_GEN_SYSTEM"]
