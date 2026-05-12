"""
Training pipeline — fetches data via CBBD API and trains the ensemble model.
Run: python -m model.train
"""
import pickle
import pandas as pd
from pathlib import Path
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from services.data_service import DataService

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
TRAIN_YEARS = range(2013, 2024)
TEST_YEAR = 2024


def build_training_data(service: DataService) -> pd.DataFrame:
    # TODO: fetch historical tournament matchups and merge with team features
    # Each row = one historical game with TeamA_*/TeamB_* feature columns + Target (1=TeamA won)
    raise NotImplementedError("Wire up historical tournament results here")


def train(df: pd.DataFrame) -> tuple:
    feature_cols = [c for c in df.columns if c.startswith("TeamA_") or c.startswith("TeamB_")]
    X = df[feature_cols].fillna(df[feature_cols].mean())
    y = df["Target"]

    train_mask = df["year"] < TEST_YEAR
    X_train, y_train = X[train_mask], y[train_mask]

    xgb = XGBClassifier(n_estimators=150, learning_rate=0.05, max_depth=4, random_state=42)
    lgbm = LGBMClassifier(n_estimators=150, learning_rate=0.05, max_depth=4, random_state=42, verbosity=-1)
    lr = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))

    model = VotingClassifier(
        estimators=[("xgb", xgb), ("lgbm", lgbm), ("lr", lr)],
        voting="soft",
    )
    model.fit(X_train, y_train)
    return model, list(feature_cols)


def save_artifacts(model, feature_cols: list[str]) -> None:
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    with open(ARTIFACTS_DIR / "model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(ARTIFACTS_DIR / "feature_cols.pkl", "wb") as f:
        pickle.dump(feature_cols, f)
    print(f"Saved model and feature list to {ARTIFACTS_DIR}")


if __name__ == "__main__":
    service = DataService()
    df = build_training_data(service)
    model, feature_cols = train(df)
    save_artifacts(model, feature_cols)
