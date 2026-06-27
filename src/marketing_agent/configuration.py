"""Define the configurable parameters for the marketing agent."""

from __future__ import annotations

from dataclasses import dataclass, field, fields

from langchain_core.runnables import RunnableConfig, ensure_config

from marketing_agent import prompts


@dataclass(kw_only=True)
class MarketingConfiguration:
    """The configuration for the marketing agent."""

    system_prompt: str = field(
        default=prompts.MARKETING_SYSTEM,
        metadata={
            "description": "The system prompt to use for the marketing agent's interactions. "
            "This prompt sets the context and behavior for the agent."
        },
    )

    @classmethod
    def from_runnable_config(
        cls, config: RunnableConfig | None = None
    ) -> MarketingConfiguration:
        """Create a MarketingConfiguration instance from a RunnableConfig object."""
        config = ensure_config(config)
        configurable = config.get("configurable") or {}
        _fields = {f.name for f in fields(cls) if f.init}
        return cls(**{k: v for k, v in configurable.items() if k in _fields})
