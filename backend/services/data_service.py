import pandas as pd
from typing import Optional
from services.cbbd_client import CBBDClient


class DataService:
    def __init__(self, client: Optional[CBBDClient] = None):
        self.client = client or CBBDClient()

    def get_team_features(self, year: int) -> pd.DataFrame:
        """
        Fetches and merges all team features for a given season into one DataFrame.
        Each row is one team. Columns are prefixed by source (adj_, elo_, srs_, stats_, shoot_).
        This is the single source of truth for building matchup feature vectors.
        """
        adj = self._fetch_adjusted_ratings(year)
        elo = self._fetch_elo(year)
        srs = self._fetch_srs(year)
        stats = self._fetch_season_stats(year)
        shooting = self._fetch_shooting_stats(year)

        df = adj
        for other in [elo, srs, stats, shooting]:
            df = pd.merge(df, other, on="team", how="left")

        df["year"] = year
        return df

    def build_matchup_features(
        self,
        team_a: str,
        team_b: str,
        seed_a: int,
        seed_b: int,
        year: int,
        team_features: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Returns a single-row DataFrame ready for model.predict_proba().
        team_a stats get prefix 'TeamA_', team_b get 'TeamB_'.
        """
        if team_features is None:
            team_features = self.get_team_features(year)

        a = self._lookup_team(team_features, team_a)
        b = self._lookup_team(team_features, team_b)

        row = {"TeamA_Seed": seed_a, "TeamB_Seed": seed_b}
        for col in team_features.columns:
            if col == "team":
                continue
            row[f"TeamA_{col}"] = a.get(col)
            row[f"TeamB_{col}"] = b.get(col)

        return pd.DataFrame([row])

    # ------------------------------------------------------------------
    # Private fetch helpers — each returns a DataFrame keyed on "team"
    # ------------------------------------------------------------------

    def _fetch_adjusted_ratings(self, year: int) -> pd.DataFrame:
        raw = self.client.get_adjusted_ratings(year)
        rows = []
        for r in raw:
            rows.append({
                "team": r.get("team"),
                "adj_oe": r.get("adjOE"),
                "adj_de": r.get("adjDE"),
                "adj_em": r.get("adjEM"),
                "adj_tempo": r.get("adjTempo"),
            })
        return pd.DataFrame(rows).dropna(subset=["team"])

    def _fetch_elo(self, year: int) -> pd.DataFrame:
        raw = self.client.get_elo_ratings(year)
        rows = []
        for r in raw:
            rows.append({
                "team": r.get("team"),
                "elo": r.get("elo"),
            })
        return pd.DataFrame(rows).dropna(subset=["team"])

    def _fetch_srs(self, year: int) -> pd.DataFrame:
        raw = self.client.get_srs_ratings(year)
        rows = []
        for r in raw:
            rows.append({
                "team": r.get("team"),
                "srs": r.get("srs"),
                "sos": r.get("sos"),
            })
        return pd.DataFrame(rows).dropna(subset=["team"])

    def _fetch_season_stats(self, year: int) -> pd.DataFrame:
        raw = self.client.get_team_season_stats(year)
        rows = []
        for r in raw:
            offense = r.get("offense") or {}
            defense = r.get("defense") or {}
            rows.append({
                "team": r.get("team"),
                "games": r.get("games"),
                "wins": r.get("wins"),
                "off_ppp": offense.get("ppp"),
                "off_fg_pct": offense.get("fgPct"),
                "off_3p_pct": offense.get("threePtPct"),
                "off_ft_pct": offense.get("ftPct"),
                "off_orb_pct": offense.get("orbPct"),
                "off_to_pct": offense.get("toPct"),
                "def_ppp": defense.get("ppp"),
                "def_fg_pct": defense.get("fgPct"),
                "def_3p_pct": defense.get("threePtPct"),
                "def_orb_pct": defense.get("orbPct"),
                "def_to_pct": defense.get("toPct"),
            })
        return pd.DataFrame(rows).dropna(subset=["team"])

    def _fetch_shooting_stats(self, year: int) -> pd.DataFrame:
        raw = self.client.get_team_shooting_stats(year)
        rows = []
        for r in raw:
            rows.append({
                "team": r.get("team"),
                "shoot_efg_pct": r.get("efgPct"),
                "shoot_ts_pct": r.get("tsPct"),
                "shoot_3p_rate": r.get("threePtRate"),
                "shoot_ft_rate": r.get("ftRate"),
            })
        return pd.DataFrame(rows).dropna(subset=["team"])

    def _lookup_team(self, df: pd.DataFrame, team_name: str) -> dict:
        row = df[df["team"] == team_name]
        if row.empty:
            raise ValueError(
                f"Team '{team_name}' not found. "
                f"Run DataService.get_team_features() to see available names."
            )
        return row.iloc[0].to_dict()
