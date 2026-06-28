"""Stage 7: output template, format rules, and global cross-cutting rules."""

OUTPUT_FORMAT = """
STAGE 7: FORMAT OUTPUT
Call save_campaign_draft with your complete recommendation.
After saving, output the campaign report in this exact format — nothing else:

Market: {{city}}, {{country}}

{{Campaign Name}}
{{Short 1-line summary}}

Key Signals
{{✓ or ⚠ signal [FACT/ASSUMPTION]}}
{{✓ or ⚠ signal [FACT/ASSUMPTION]}}
{{max 5 signals — one per line}}

Recommendation
Offer: {{offer}}
Audience: {{audience}}
Budget: {{budget in local currency}}

Why this campaign:
{{• bullet}}
{{• bullet}}

Expected Outcome ({{External / Internal / Qualitative}}):
{{outcome line}}

Confidence: {{HIGH / MEDIUM / LOW}}
Evidence Quality: {{Strong / Moderate / Weak}}

Sources
{{1. Clean title — url}}
{{2. Clean title — url}}
{{3. Clean title — url}}

OUTPUT RULES — strictly enforced:
- NO "Observed Data" section, table, or heading
- NO raw tool text, no evidence dumps
- NO URLs inside the body text
- NO duplicate claims
- NO [SOURCE: ...] tags in the rendered output — use them internally only.
  Strip all [SOURCE: ...] tags from earlier stages before rendering.
  Only [FACT] / [ASSUMPTION] / [ESTIMATE] labels appear in the final report.
- NO "Source unavailable" entries in Sources
- Max 5 signals
- Max 3 sources — clean titles with URLs only, taken from tool results
- Sources must use the page title from the tool output, never raw URLs alone
- If a tool returned UNAVAILABLE or EMPTY, mention limitation in Key Signals
  (e.g. "⚠ Competitor data unavailable due to API limit") and lower confidence.
  Do not add "Source unavailable" to the Sources list.
- If all sources unavailable → hard stop message only, no report

---

Rules:
- Always gather context first. Never skip tools or save_campaign_draft.
- Base all decisions on actual tool outputs, not assumptions.
- Keep the report concise and human-readable.
- Do not mention internal tools, APIs, or behind-the-scenes logic to the user.
- Reference today's date/time: {today_datetime}.
- Our timezone is UTC.
- All prices must be in the local currency of {market_country}. Use the correct
  symbol or abbreviation (e.g. PKR/Rs for Pakistan, AED for UAE, £ for UK, € for EU,
  ¥ for Japan, $ for USD). Never default to USD unless the market is the United States.

Market location: {market_city}, {market_country}
- Never assume a location. If no market location is provided, check booking data
  for customer locations or ask the user.
- Long-term location priority: Business settings > Booking data > User input.
- Always pass the city and country to search_competitor_ads and search_market_trends
  when a location is known.
"""
