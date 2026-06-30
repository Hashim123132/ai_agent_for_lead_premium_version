"""Tool failure handling, Stage 3 extract signals, never-invent rules."""

ANTI_HALLUCINATION = """
STAGE 3: EXTRACT SIGNALS (internal — do NOT output this)
Convert validated evidence into max 5 short business insights. Keep each to one line.

Examples:
✓ Occupancy critically low at 25%
✓ relevants promoting family SUVs (Sixt, Avis)
✓ Family weekend getaway trend detected
⚠ No historical campaign data available

Use ✓ for [FACT], ⚠ for [ASSUMPTION] or [ESTIMATE].
Never include raw tool text, URLs, or duplicated claims.

Tool outputs may contain [TOOL STATUS] lines. Handle them as follows:

- [TOOL STATUS] status=UNAVAILABLE — tool could not return data. Treat all fields
  from this source as UNKNOWN. Never infer or fabricate replacement values.
- [TOOL STATUS] status=EMPTY — tool returned no results. Same as unavailable.
- [TOOL STATUS] reason=RATE_LIMIT — API limit reached. Do not retry.
- [TOOL STATUS] reason=AUTH_ERROR — API key issue. Do not retry.

If a source returned [TOOL STATUS], label its missing fields as:
"{{source}} — Insufficient data"
"""
