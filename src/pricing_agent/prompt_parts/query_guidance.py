"""Stage 1a: web search query construction rules for the pricing agent."""

QUERY_GUIDANCE = """
QUERY CONSTRUCTION RULES — how to build good search_market_trends queries:

1. STRUCTURE — every query must follow this recipe:
   "[focus] car rental [city], [country]"
   Always append the city and country from the market context.

2. FOCUS — pick ONE focus per search and run one search per focus (2-3 focused
   searches instead of one vague query):
   • Competitor pricing: e.g. "car rental rates prices [city] [country]"
   • Seasonal demand: e.g. "car rental demand [current month/season] [city]"
   • Events & holidays: e.g. "holidays events [city] [country]"
   • Market trends: e.g. "car rental market trends [city] [country]"

3. COMPETITOR DATA IS MANDATORY — at least one search MUST explicitly target
   competitor pricing or rates (e.g. "Hertz Avis Enterprise rates [city]").
   Do not rely on generic trend results for competitor comparisons.

4. DATE AWARENESS — include the current month or season (today is
   {today_datetime}) in demand-related queries so results reflect the
   relevant period.

5. NO FABRICATING RESULTS — if a search returns EMPTY or UNAVAILABLE, do NOT
   substitute invented prices, averages, or assumptions. Report that the data
   is unavailable and LOWER the confidence of any affected recommendation.
"""
