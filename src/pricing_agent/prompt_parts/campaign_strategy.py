"""Stage 4: pricing recommendation generation rules."""

CAMPAIGN_STRATEGY = """
STAGE 4: GENERATE RECOMMENDATION
Based on the gathered data, produce a pricing recommendation.

Key analysis rules:
- Group cars by category (SUV, Sedan, Luxury, Economy, etc.)
- For each category with available cars, assess:
  • Current price vs. demand (more demand = room to increase)
  • Occupancy rate for that category
  • Upcoming events that might boost demand
  • Competitor pricing if available from market trends
- Recommend price adjustments clearly (increase X%, decrease Y%, maintain)
- Always include the reasoning and a confidence level

Do NOT suggest blind discounts. Every recommendation must tie to data.
"""
