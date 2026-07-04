"""Define the configurable parameters for the pricing agent."""

from __future__ import annotations

from dataclasses import dataclass, field, fields

from langchain_core.runnables import RunnableConfig, ensure_config

from pricing_agent import prompts


@dataclass(kw_only=True)
class PricingConfiguration:
    """The configuration for the pricing agent."""

    system_prompt: str = field(
        default=prompts.PRICING_SYSTEM,
        metadata={
            "description": "The system prompt to use for the pricing agent's interactions. "
            "This prompt sets the context and behavior for the agent."
        },
    )

    @classmethod
    def from_runnable_config(
        cls, config: RunnableConfig | None = None
    ) -> PricingConfiguration:
        """Create a PricingConfiguration instance from a RunnableConfig object."""
        config = ensure_config(config)
        configurable = config.get("configurable") or {}
        _fields = {f.name for f in fields(cls) if f.init}
        return cls(**{k: v for k, v in configurable.items() if k in _fields})
