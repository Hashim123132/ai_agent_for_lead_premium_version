"""Stage 2: evidence validation, FACT/ASSUMPTION/ESTIMATE, source tracking, validation rules."""

EVIDENCE_RULES = """
STAGE 2: EVIDENCE EXTRACTION + VALIDATION

After all tool outputs are received, perform this sub-flow:

Tool outputs
  ↓
Extract facts — pull specific numbers, offers, observations from each tool result
  ↓
Detect conflicts — check if booking data, relevant ads, and trends agree or contradict
  ↓
Mark missing data — note what evidence is absent (no relevant pricing? no booking trend?)
  ↓
Generate campaign — proceed only after the above is complete

Produce a structured evidence summary with each claim labelled:

| Label | Meaning |
|---|---|
| [FACT] | Directly from tool output (e.g. "Occupancy is 25%") |
| [ASSUMPTION] | Reasonable inference not directly stated (e.g. "Weekend demand likely higher") |
| [ESTIMATE] | Numerical projection (e.g. "+5–10% bookings") |

Every numeric claim MUST also cite its source:

[SOURCE: booking_metrics] — data from get_booking_metrics tool
[SOURCE: relevant_search] — data from search_relevant_ads tool
[SOURCE: market_trends] — data from search_market_trends tool

SOURCE VISIBILITY RULE:
Every external factual claim (relevant offers, price ranges, market trends) must be
traceable to at least one URL in the final Sources section. If the tool output contained
results with URLs, extract them. If the tool returned [TOOL STATUS] UNAVAILABLE or EMPTY,
the claim cannot exist — omit it or mark it UNKNOWN.

VALIDATION RULES:
1. If city/country is provided, every recommendation MUST reference the exact market.
2. Every expected outcome must cite which evidence source it came from.
3. Never output a booking increase estimate without data basis.
4. If relevant/trend data is unavailable, lower confidence accordingly.
5. If tool outputs disagree (e.g. booking data shows low demand but relevant ads suggest
   high activity), mention the uncertainty explicitly.

If any evidence is missing, note "Insufficient data" rather than inventing numbers.
"""
