"""Tool to search the web for local car rental market trends."""

from langchain_core.tools import tool


def _normalize_error(source: str, e: Exception) -> str:
    msg = str(e).lower()
    if "rate limit" in msg or "429" in msg or "too many requests" in msg:
        reason = "RATE_LIMIT"
    elif "api_key" in msg or "tavily_api_key" in msg or "auth" in msg or "unauthorized" in msg:
        reason = "AUTH_ERROR"
    elif "no module" in msg or "not found" in msg:
        reason = "CONFIG_ERROR"
    else:
        reason = "SERVICE_ERROR"
    return f"[TOOL STATUS] source={source} status=UNAVAILABLE reason={reason} message={e!s}"


@tool
def search_market_trends(
    query: str = "",
    city: str = "",
    country: str = "",
) -> str:
    """Search the web for local car rental market trends, seasonal demand, and events.

    Args:
        query: Search focus (e.g. "summer demand", "holiday season").
        city: Target city for the search (e.g. "Houston", "Dubai").
        country: Target country for the search (e.g. "USA", "UAE").
    """
    try:
        from langchain_community.tools import TavilySearchResults

        try:
            tavily = TavilySearchResults(max_results=6)
        except Exception as e:
            return _normalize_error("market_trends", e)

        parts = [query or "car rental market trends seasonal demand local events"]
        if city:
            parts.append(city)
        if country:
            parts.append(country)
        search_query = " ".join(parts)
        results = tavily.invoke(search_query)

        if isinstance(results, str):
            return _normalize_error("market_trends", Exception(results))

        if not results:
            return "[TOOL STATUS] source=market_trends status=EMPTY reason=NO_RESULTS message=No market trend data found via web search."

        lines = ["Market Trends & Local Context:"]
        for r in results:
            title = r.get("title", "")
            content = r.get("content", "")
            url = r.get("url", "")
            lines.append(f"- {title}")
            if content:
                lines.append(f"  {content[:300]}")
            if url:
                lines.append(f"  Source: {url}")

        return "\n".join(lines)

    except Exception as e:
        return _normalize_error("market_trends", e)
