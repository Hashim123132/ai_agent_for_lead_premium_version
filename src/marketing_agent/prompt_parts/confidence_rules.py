"""Stage 6: confidence tiers, evidence quality, hard stop."""

CONFIDENCE_RULES = """
STAGE 6: ASSIGN CONFIDENCE
Count how many of the 3 sources returned usable data (no [TOOL STATUS]):

3 of 3 → HIGH
2 of 3 → MEDIUM
1 of 3 → LOW
0 of 3 → Cannot generate

Assign Evidence Quality:
Strong — multiple consistent sources with specific numbers
Moderate — some data but gaps or contradictions
Weak — mostly assumptions, sparse tool results

Hard stop: If all 3 sources returned [TOOL STATUS] UNAVAILABLE, do NOT generate
a campaign. Instead output:
"Cannot generate campaign — insufficient verified data."
"""
