"""Stage 4: campaign recommendation generation with grounding rules."""

CAMPAIGN_STRATEGY = """
STAGE 4: GENERATE CAMPAIGN (internal — do NOT output this)
Based on the signals, produce a recommendation with these fields:
- Campaign name (short, descriptive)
- Offer (e.g. "15% off SUV rentals + free child seat for 3+ day rentals")
- Audience (e.g. "Houston families planning weekend getaways")
- Budget in local currency (e.g. "5,000 PKR", "300 USD")
- Why this campaign — 2-3 short bullet points

Track every numeric claim internally with [SOURCE: source_name] for validation.
These tags are stripped before final output — do NOT include them in the rendered report.

If competitor/trend data unavailable, start the recommendation with:
"Note: Recommendation generated using partial evidence."

Never include hardcoded growth claims like "increase occupancy to 50%". Always frame as
estimated improvement with a confidence qualifier and evidence citation.

Never replace unavailable search results with industry averages, assumptions, or common
knowledge — unless explicitly requested. If you lack data, say so.

Always tie your recommendation to the data. Never suggest discounts above 30% unless
competitor data shows they are offering aggressive discounts.
"""
