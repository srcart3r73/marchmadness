"""
Loads the trained model and returns win probabilities for a single matchup.
"""
import pickle
import pandas as pd
from pathlib import Path
from functools import lru_cache

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"


@lru_cache(maxsize=1)
def _load_artifacts():
    with open(ARTIFACTS_DIR / "model.pkl", "rb") as f:
        model = pickle.load(f)
    with open(ARTIFACTS_DIR / "feature_cols.pkl", "rb") as f:
        feature_cols = pickle.load(f)
    return model, feature_cols


def predict_win_prob(matchup_features: pd.DataFrame) -> float:
    """Returns P(TeamA wins) given a matchup feature row from DataService.build_matchup_features()."""
    model, feature_cols = _load_artifacts()

    missing = [c for c in feature_cols if c not in matchup_features.columns]
    for col in missing:
        matchup_features[col] = 0.0

    X = matchup_features[feature_cols].fillna(0.0)
    return float(model.predict_proba(X)[0][1])
