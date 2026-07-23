import os
import requests
import datetime
from typing import Any

API_VERSION = "v18.0"
GRAPH_URL = f"https://graph.facebook.com/{API_VERSION}"


class FacebookClient:
    def __init__(self, page_access_token: str | None = None):
        self.token = page_access_token or os.getenv("FB_PAGE_ACCESS_TOKEN", "")
        if not self.token:
            raise ValueError("FB_PAGE_ACCESS_TOKEN is not set")

    def _get(self, path: str, params: dict | None = None) -> dict:
        params = params or {}
        params["access_token"] = self.token
        resp = requests.get(f"{GRAPH_URL}/{path}", params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, data: dict | None = None) -> dict:
        data = data or {}
        data["access_token"] = self.token
        resp = requests.post(f"{GRAPH_URL}/{path}", data=data, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_page_id(self) -> str:
        data = self._get("me", {"fields": "id"})
        return data["id"]

    def get_page_posts(self, limit: int = 100) -> list[dict]:
        page_id = self.get_page_id()
        fields = "id,message,created_time,permalink_url,attachments{media_type,media,target}"
        posts = []
        url = f"{page_id}/posts"
        params = {"fields": fields, "limit": min(limit, 100)}

        while len(posts) < limit:
            data = self._get(url, params)
            posts.extend(data.get("data", []))
            pagination = data.get("paging", {})
            next_url = pagination.get("next")
            if not next_url or len(posts) >= limit:
                break
            url = next_url
            params = {}

        return posts[:limit]

    def get_post_insights(self, post_id: str) -> dict:
        metrics = [
            "reach",
            "impressions",
            "engaged_users",
            "clicks",
            "reactions",
            "comments",
            "shares",
        ]
        try:
            data = self._get(f"{post_id}/insights", {"metric": ",".join(metrics)})
        except requests.HTTPError:
            return {}
        result: dict[str, Any] = {}
        for entry in data.get("data", []):
            name = entry.get("name", "")
            values = entry.get("values", [])
            if values:
                value = values[-1].get("value", 0)
                if isinstance(value, dict):
                    value = sum(value.values())
                result[name] = value
            else:
                result[name] = 0
        # fetch individual reaction breakdown
        try:
            reactions_data = self._get(f"{post_id}/insights", {"metric": "post_reactions_by_type_total"})
            for entry in reactions_data.get("data", []):
                values = entry.get("values", [])
                if values:
                    result["reactions_breakdown"] = values[-1].get("value", {})
        except requests.HTTPError:
            pass
        return result

    def get_page_insights(self) -> dict:
        metrics = [
            "page_fan_adds",
            "page_fan_removes",
            "page_impressions",
            "page_impressions_unique",
            "page_engaged_users",
            "page_views_total",
        ]
        result: dict[str, Any] = {}
        for metric in metrics:
            try:
                data = self._get("me/insights", {"metric": metric, "period": "day"})
                values = data.get("data", [])
                if values:
                    vals = values[0].get("values", [])
                    if vals:
                        result[metric] = vals[-1].get("value", 0)
            except requests.HTTPError:
                pass
        # Get current follower count
        try:
            me = self._get("me", {"fields": "followers_count"})
            result["followers_count"] = me.get("followers_count", 0)
        except requests.HTTPError:
            result["followers_count"] = 0
        return result

    def get_historical_page_insights(self, since: str, until: str) -> list[dict]:
        metrics = [
            "page_fan_adds",
            "page_fan_removes",
            "page_impressions",
            "page_impressions_unique",
            "page_engaged_users",
        ]
        snapshots = []
        for metric in metrics:
            try:
                data = self._get("me/insights", {
                    "metric": metric,
                    "period": "day",
                    "since": since,
                    "until": until,
                })
                for entry in data.get("data", []):
                    for val in entry.get("values", []):
                        snapshots.append({
                            "metric": metric,
                            "date": val.get("end_time", ""),
                            "value": val.get("value", 0),
                        })
            except requests.HTTPError:
                pass
        return snapshots

    def _post_multipart(self, path: str, data: dict, files: dict | None = None) -> dict:
        data["access_token"] = self.token
        resp = requests.post(f"{GRAPH_URL}/{path}", data=data, files=files, timeout=60)
        resp.raise_for_status()
        return resp.json()

    def create_post(self, message: str, image_url: str | None = None) -> dict:
        page_id = self.get_page_id()
        if image_url:
            data = {"message": message, "url": image_url}
            return self._post(f"{page_id}/photos", data)
        return self._post(f"{page_id}/feed", {"message": message})

    def create_post_with_image_bytes(
        self, message: str, image_bytes: bytes, filename: str = "image.jpg"
    ) -> dict:
        page_id = self.get_page_id()
        return self._post_multipart(
            f"{page_id}/photos",
            data={"message": message, "published": "true"},
            files={"source": (filename, image_bytes, "image/jpeg")},
        )
