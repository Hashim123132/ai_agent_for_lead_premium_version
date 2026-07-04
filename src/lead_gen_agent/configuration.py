"""Define the configurable parameters for the lead generation agent."""

from __future__ import annotations

from dataclasses import dataclass, field, fields

from langchain_core.runnables import RunnableConfig, ensure_config

from lead_gen_agent import prompts


@dataclass(kw_only=True)
class LeadGenConfiguration:
    """The configuration for the lead generation agent."""

    system_prompt: str = field(
        default=prompts.LEAD_GEN_SYSTEM,
        metadata={
            "description": "The system prompt to use for the lead generation agent's interactions."
        },
    )

    @classmethod
    def from_runnable_config(
        cls, config: RunnableConfig | None = None
    ) -> LeadGenConfiguration:
        """Create a LeadGenConfiguration instance from a RunnableConfig object."""
        config = ensure_config(config)
        configurable = config.get("configurable") or {}
        _fields = {f.name for f in fields(cls) if f.init}
        return cls(**{k: v for k, v in configurable.items() if k in _fields})
