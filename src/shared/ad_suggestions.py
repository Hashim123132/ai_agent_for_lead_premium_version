"""Search relevant ads with mode-based queries and analyze patterns."""

import asyncio
import json
import os
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

BRAND_DOMAINS = {
    "hertz": "Hertz",
    "avis": "Avis",
    "budget": "Budget",
    "enterprise": "Enterprise",
    "national": "National",
    "alamo": "Alamo",
    "sixt": "Sixt",
    "europcar": "Europcar",
    "dollar": "Dollar",
    "thrifty": "Thrifty",
    "payless": "Payless",
    "fox": "Fox",
    "firefly": "Firefly",
    "goldcar": "Goldcar",
    "discovercars": "DiscoverCars",
    "rentalcars": "RentalCars",
    "keddy": "Keddy",
    "buchbinder": "Buchbinder",
    "greenmotion": "Green Motion",
}

QUERIES: dict[str, list[str]] = {
    "web": [
        "{goal} car rental offers promotions {city} {country}",
        "car rental {goal} landing pages deals {city} {country}",
        "{goal} car rental ads promotions {city} {country}",
        "car rental promotional campaigns creatives {city} {country} {goal}",
    ],
    "deep": [
        "{goal} car rental Facebook Instagram ads {city} {country}",
        "car rental search ads ad examples {city} {country}",
        "car rental offers promotions {city} {country} {goal}",
        "car rental advertising trends insights {city} {country}",
    ],
    "pinterest": [
        "{goal} car rental ad {city} {country} site:pinterest.com",
        "car rental {goal} social media campaign {city} site:pinterest.com",
        "car rental ads promotions {city} {country} site:pinterest.com",
        "car rental marketing creatives visual {city} site:pinterest.com",
    ],
}


def _extract_brand(url: str, title: str) -> str:
    try:
        domain = urlparse(url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        for key, val in BRAND_DOMAINS.items():
            if key in domain:
                return val
        main_part = domain.split(".")[0]
        if main_part and len(main_part) > 2:
            return main_part.title()
    except Exception:
        pass
    if title:
        title_lower = title.lower()
        for key, val in BRAND_DOMAINS.items():
            if key in title_lower:
                return val
    return "Unknown"


def _build_query(template: str, city: str, country: str, goal: str) -> str:
    q = template.replace("{city}", city or "")
    q = q.replace("{country}", country or "")
    q = q.replace("{goal}", goal or "")
    return re.sub(r"\s+", " ", q).strip()


def _deduplicate(ads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen_urls: set[str] = set()
    seen_images: set[str] = set()
    deduped = []
    for ad in ads:
        src = ad.get("source_url", "") or ""
        img = ad.get("image_url", "") or ""
        key = src or img
        if key and key not in seen_urls and img not in seen_images:
            seen_urls.add(key)
            seen_images.add(img)
            deduped.append(ad)
    return deduped


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().removeprefix("www.")
    except Exception:
        return ""


async def _run_tavily(
    client: Any, query: str, max_results: int
) -> list[dict[str, Any]]:
    response = await asyncio.to_thread(
        client.search,
        query=query,
        search_depth="advanced",
        include_images=True,
        max_results=max_results,
    )
    results = response.get("results", [])
    images_raw = response.get("images", [])

    structured = []
    for i, r in enumerate(results):
        if isinstance(r, dict):
            url = r.get("url", "")
            title = r.get("title", "")
            content = r.get("content", "")
        else:
            url = getattr(r, "url", "") or ""
            title = getattr(r, "title", "") or ""
            content = getattr(r, "content", "") or ""

        img_url = ""
        if i < len(images_raw):
            img = images_raw[i]
            img_url = img.get("url", "") if isinstance(img, dict) else str(img)

        structured.append(
            {
                "source_url": url,
                "title": title,
                "content": content[:500],
                "image_url": img_url,
            }
        )

    return structured


async def _search_text_ddg(query: str, max_results: int) -> list[dict[str, Any]]:
    from duckduckgo_search import DDGS

    try:
        results = await asyncio.to_thread(
            lambda: list(DDGS().text(keywords=query, max_results=max_results))
        )
        return [
            {
                "source_url": r.get("href", ""),
                "title": r.get("title", ""),
                "content": r.get("body", "")[:500],
                "image_url": "",
            }
            for r in results
        ]
    except Exception:
        return []


async def _search_images_ddg(query: str, max_results: int) -> list[dict[str, Any]]:
    from duckduckgo_search import DDGS

    try:
        results = await asyncio.to_thread(
            lambda: list(DDGS().images(keywords=query, max_results=max_results))
        )
        out = []
        for r in results:
            out.append(
                {
                    "image_url": r.get("image", ""),
                    "title": r.get("title", ""),
                    "source_url": r.get("url", ""),
                    "content": r.get("source", ""),
                }
            )
        return out
    except Exception:
        return []


def _score_relevance(ad: dict[str, Any], city: str, country: str) -> int:
    score = 0
    title = (ad.get("title", "") or "").lower()
    content = (ad.get("content", "") or "").lower()
    source = (ad.get("source_url", "") or "").lower()

    if city:
        c = city.lower()
        if c in title:
            score += 3
        if c in content:
            score += 2
        if c in source:
            score += 1

    if country:
        c = country.lower()
        if c in title:
            score += 2
        if c in content:
            score += 1
        if c in source:
            score += 1

    return score


async def search_relevant_ads(
    mode: str, city: str, country: str, goal: str
) -> list[dict[str, Any]]:
    templates = QUERIES.get(mode, QUERIES["web"])
    now = datetime.now(timezone.utc).isoformat()

    max_per_query = 12 if mode == "pinterest" else 8 if mode == "web" else 6

    all_text: list[dict[str, Any]] = []
    all_images: list[dict[str, Any]] = []

    api_key = os.getenv("TAVILY_API_KEY")
    tavily_client = None
    if api_key:
        from tavily import TavilyClient
        tavily_client = TavilyClient(api_key=api_key)

    for template in templates:
        query = _build_query(template, city, country, goal)
        if not query:
            continue

        tasks = [
            _search_text_ddg(query, max_per_query),
            _search_images_ddg(query, max_per_query),
        ]
        if tavily_client:
            tasks.insert(
                0,
                asyncio.wait_for(
                    _run_tavily(tavily_client, query, max_per_query),
                    timeout=15,
                ),
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)

        if tavily_client:
            tavily_results, ddg_results, image_results = results
            if isinstance(tavily_results, BaseException):
                tavily_results = []
            if isinstance(ddg_results, BaseException):
                ddg_results = []
            if isinstance(image_results, BaseException):
                image_results = []
            text_results = ddg_results if ddg_results else tavily_results
        else:
            ddg_results, image_results = results
            if isinstance(ddg_results, BaseException):
                ddg_results = []
            if isinstance(image_results, BaseException):
                image_results = []
            text_results = ddg_results

        all_text.extend(text_results)
        all_images.extend(image_results)

    domain_to_images: dict[str, list[dict[str, Any]]] = {}
    for img in all_images:
        d = _domain(img.get("source_url", "")) or _domain(img.get("image_url", ""))
        domain_to_images.setdefault(d, []).append(img)

    used_images: set[str] = set()
    ads = []

    for txt in all_text:
        source_domain = _domain(txt.get("source_url", ""))
        img_url = txt.get("image_url", "")

        if source_domain and source_domain in domain_to_images:
            candidates = domain_to_images[source_domain]
            matched = None
            for c in candidates:
                u = c.get("image_url", "")
                if u and u not in used_images:
                    matched = c
                    break
            if matched:
                img_url = matched["image_url"]
                used_images.add(img_url)
                if not txt.get("title") and matched.get("title"):
                    txt["title"] = matched["title"]

        elif all_images:
            unmatched = [
                x
                for x in all_images
                if x.get("image_url", "") and x["image_url"] not in used_images
            ]
            if unmatched:
                fallback = unmatched[0]
                img_url = fallback["image_url"]
                used_images.add(img_url)
                if not txt.get("title") and fallback.get("title"):
                    txt["title"] = fallback["title"]

        if not img_url:
            continue

        brand = _extract_brand(txt.get("source_url", ""), txt.get("title", ""))
        ads.append(
            {
                "image_url": img_url,
                "source_url": txt.get("source_url", ""),
                "brand": brand,
                "title": txt.get("title", f"relevant Ad #{len(ads) + 1}"),
                "content": txt.get("content", ""),
                "captured_at": now,
            }
        )

    leftover = [
        x
        for x in all_images
        if x.get("image_url", "") and x["image_url"] not in used_images
    ]
    for img in leftover[: max(0, 12 - len(ads))]:
        img_url = img["image_url"]
        if img_url in used_images:
            continue
        used_images.add(img_url)
        brand = _extract_brand(
            img.get("source_url", img_url), img.get("title", "")
        )
        ads.append(
            {
                "image_url": img_url,
                "source_url": img.get("source_url", ""),
                "brand": brand,
                "title": img.get("title", f"relevant Ad #{len(ads) + 1}"),
                "content": img.get("content", ""),
                "captured_at": now,
            }
        )

    if mode == "pinterest":
        ads = [
            ad for ad in ads
            if "pinterest" in ad.get("source_url", "").lower()
        ]

    threshold = 0
    if city:
        threshold = 2
    elif country:
        threshold = 1

    if threshold > 0:
        scored = [(ad, _score_relevance(ad, city, country)) for ad in ads]
        scored = [(ad, s) for ad, s in scored if s >= threshold]
        scored.sort(key=lambda x: -x[1])
        ads = [ad for ad, _ in scored]

    return _deduplicate(ads)[:12]


async def analyze_ads(
    ads: list[dict[str, Any]], mode: str, city: str, country: str, goal: str
) -> dict[str, str]:
    from langchain_mistralai import ChatMistralAI

    default = {
        "observed_ad": "",
        "creative_pattern": "",
        "attention_signals": "",
        "suggested_adaptation": "",
        "confidence": "low",
    }

    if not ads:
        return default

    model = ChatMistralAI(model="mistral-small-latest")

    ads_text = "\n".join(
        (
            f"- Brand: {a['brand']}\n"
            f"  Title: {a['title']}\n"
            f"  Description: {a.get('content', '')[:300]}\n"
            f"  Source: {a['source_url']}"
        )
        for a in ads[:8]
    )

    mode_labels = {
        "web": "relevant websites and landing pages",
        "deep": "social media, search ads, relevant offers, and trends",
        "pinterest": "Pinterest boards and pins",
    }
    channel_label = mode_labels.get(mode, "web")

    location = ""
    if city or country:
        location = f" for {city}, {country}"
        scoring_extra = "\n- Local relevance: are the ads specific to this city/country?"
    else:
        scoring_extra = ""

    prompt = (
        f"You are a marketing analyst. Analyze relevant car rental ads{location} sourced from {channel_label}.\n"
        f"Business goal: {goal}\n\n"
        f"Ads:\n{ads_text}\n\n"
        "Analyze patterns using these scoring lenses:\n"
        "- Freshness: how recent do the creative approaches appear?\n"
        "- Repeat appearance: do similar patterns appear across multiple sources?\n"
        "- Creative similarity: do ads share visual or messaging styles?" + scoring_extra + "\n\n"
        "Return a JSON object with EXACTLY these keys (no markdown, no code fences):\n"
        '- observed_ad: what specific ad pattern or approach was observed? Use phrases like "observed repeatedly", "commonly promoted"\n'
        '- creative_pattern: what creative structure or format appears active?\n'
        '- attention_signals: what hooks or attention-grabbing elements show up? Use "shows attention signals like..."\n'
        '- suggested_adaptation: how could {goal} business adapt this for their own ads?\n'
        '- confidence: high/medium/low based on evidence strength\n\n'
        "CRITICAL LANGUAGE RULES:\n"
        "- NEVER use these words: 'best', 'highest converting', 'top ROI'\n"
        "- DO use phrases like: 'observed repeatedly', 'appears active', 'commonly promoted', 'shows attention signals'\n"
        "- Only claim what the evidence supports\n"
        "- If unsure or evidence is thin, set confidence to 'low'\n\n"
        "Return ONLY the raw JSON object."
    )

    response = await model.ainvoke(prompt)
    content = response.content if hasattr(response, "content") else str(response)

    try:
        json_match = re.search(r"\{[\s\S]*\}", content)
        if json_match:
            return json.loads(json_match.group())
        return json.loads(content)
    except (json.JSONDecodeError, ValueError):
        return {
            "observed_ad": content[:300] if content.strip() else "",
            "creative_pattern": "",
            "attention_signals": "",
            "suggested_adaptation": "",
            "confidence": "low",
        }
