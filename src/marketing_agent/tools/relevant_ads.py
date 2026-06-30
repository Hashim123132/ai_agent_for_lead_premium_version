"""Tool to search the web for relevant car rental ads and offers."""

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
def search_relevant_ads(
    query: str = "",
    city: str = "",
    country: str = "",
) -> str:
    """Search the web for relevant rental car ads, offers, and promotions.

    Args:
        query: Search focus (e.g. "SUV discounts", "weekend deals").
        city: Target city for the search (e.g. "Houston", "Dubai").
        country: Target country for the search (e.g. "USA", "UAE").
    """
    try:
        from langchain_community.tools import TavilySearchResults

        try:
            tavily = TavilySearchResults(max_results=6)
        except Exception as e:
            return _normalize_error("relevant_search", e)

        parts = [query or "car rental relevant ads offers discounts promotions"]
        if city:
            parts.append(city)
        if country:
            parts.append(country)
        search_query = " ".join(parts)
        results = tavily.invoke(search_query)

        if isinstance(results, str):
            return _normalize_error("relevant_search", Exception(results))

        if not results:
            return "[TOOL STATUS] source=relevant_search status=EMPTY reason=NO_RESULTS message=No relevant data found via web search."

        lines = ["relevant Ads & Offers:"]
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
        return _normalize_error("relevant_search", e)
