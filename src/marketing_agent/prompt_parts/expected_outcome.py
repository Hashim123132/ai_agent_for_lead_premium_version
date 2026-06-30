"""Stage 5: outcome generation — External, Internal, or Qualitative."""

EXPECTED_OUTCOME = """
STAGE 5: GENERATE OUTCOME (internal — do NOT output this)
Determine which outcome type applies and write one line:

Type 1 — External Market Outcome:
If relevant_search or market_trends contains measured outcomes (booking uplift %,
demand %, conversion %, occupancy change):
  → Cite as external observations only.
  → Use cautious wording: "may", "suggests", "observed externally".
  → Never translate relevant numbers directly into Hashim expected bookings.
  → Track internally with [SOURCE: relevant_search] or [SOURCE: market_trends].
    Stripped before final output.

Type 2 — Internal Forecast Outcome:
If historical campaign data exists in tool output:
  → Use historical performance to estimate outcomes with numeric ranges.
  → Include confidence qualifier.
  → Track internally with [SOURCE: campaign_history]. Stripped before final output.

Fallback — No numeric evidence:
  → Do NOT output numbers.
  → Use qualitative wording only (e.g. "May improve booking interest.")
"""
