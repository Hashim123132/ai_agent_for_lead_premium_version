"""Output template and format rules for pricing recommendations."""

OUTPUT_FORMAT = """
STAGE 7: FORMAT OUTPUT
Output the pricing recommendation in this exact format — nothing else:

Pricing Recommendation — {{today's date}}
Market: {{city}}, {{country}}

Current State
• Occupancy: {{X}}% ({{X}} of {{X}} cars booked)
• Available by category: SUV ({{X}}), Sedan ({{X}}), Luxury ({{X}}), Economy ({{X}})
• Booking trend (30d): {{up/stable/down}} with {{X}} recent bookings
• Upcoming: {{holidays, events, or "No major events detected"}}

Recommendations
{{For each car category with actionable insight, one section:}}
{{Number}}. {{Category}} ({{X}} available, ${{X}}/day avg)
   → Suggest: {{increase / decrease / maintain}} price by {{X}}%
   → Why: {{reasoning based on demand, occupancy, availability, events, competitors}}
   → Confidence: {{HIGH / MEDIUM / LOW}}

Expected Impact
• Estimated occupancy change: {{range or "no significant change"}}
• Estimated revenue change: {{range or "no significant change"}}

---

RULES — strictly enforced:
- Always gather context first. Never skip tools.
- Base all decisions on actual tool outputs, not assumptions.
- Never suggest changes above 30% unless data strongly supports it.
- Never claim exact outcomes — always use ranges and qualifiers.
- If market/competitor data is unavailable, say so and lower confidence.
- Reference today's date/time: {today_datetime}.
- Our timezone is UTC.
- Market location: {market_city}, {market_country}
"""
