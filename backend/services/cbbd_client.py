import os
import time
import requests
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.collegebasketballdata.com"
MAX_RETRIES = 3
RETRY_BACKOFF = 1.0


class CBBDClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("CBBD_API_KEY")
        if not self.api_key:
            raise ValueError("CBBD_API_KEY not set. Add it to your .env file.")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        })

    def get(self, endpoint: str, params: Optional[dict] = None) -> Any:
        url = f"{BASE_URL}{endpoint}"
        for attempt in range(MAX_RETRIES):
            try:
                resp = self.session.get(url, params=params, timeout=30)
                if resp.status_code == 429:
                    time.sleep(RETRY_BACKOFF * (2 ** attempt))
                    continue
                resp.raise_for_status()
                return resp.json()
            except requests.exceptions.RequestException:
                if attempt == MAX_RETRIES - 1:
                    raise
                time.sleep(RETRY_BACKOFF * (2 ** attempt))
        raise RuntimeError(f"Failed to fetch {endpoint} after {MAX_RETRIES} retries")

    def get_teams(self) -> list[dict]:
        return self.get("/teams")

    def get_adjusted_ratings(self, year: int, season_type: str = "regular") -> list[dict]:
        return self.get("/ratings/adjusted", params={"year": year, "seasonType": season_type})

    def get_elo_ratings(self, year: int) -> list[dict]:
        return self.get("/ratings/elo", params={"year": year})

    def get_srs_ratings(self, year: int) -> list[dict]:
        return self.get("/ratings/srs", params={"year": year})

    def get_team_season_stats(self, year: int, season_type: str = "regular") -> list[dict]:
        return self.get("/stats/team/season", params={"year": year, "seasonType": season_type})

    def get_team_shooting_stats(self, year: int, season_type: str = "regular") -> list[dict]:
        return self.get("/stats/team/shooting/season", params={"year": year, "seasonType": season_type})

    def get_rankings(self, year: int, season_type: str = "regular") -> list[dict]:
        return self.get("/rankings", params={"year": year, "seasonType": season_type})
