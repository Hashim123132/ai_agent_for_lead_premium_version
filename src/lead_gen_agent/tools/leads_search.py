"""Tool to search for potential business leads via web search."""

from langchain_core.tools import tool

from marketing_agent.tools.market_trends import search_market_trends as _web_search


@tool
def search_business_leads(query: str, city: str = "", country: str = "") -> str:
    """Search the web for potential business leads — hotels, travel agencies,
    corporate clients, event planners, or any business that could partner
    with a car rental service.

    Args:
        query: What to search for (e.g. "hotels", "travel agencies", "corporate offices")
        city: City to search in
        country: Country to search in
    """
    full_query = f"{query} in {city}, {country} car rental partnership" if city or country else query
    return _web_search.invoke({"query": full_query, "city": city, "country": country})
