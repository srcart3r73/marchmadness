from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.data_service import DataService
from model.predictor import predict_win_prob
from model.simulator import simulate_bracket, Team

app = FastAPI(title="March Madness API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

service = DataService()


class MatchupRequest(BaseModel):
    team_a: str
    team_b: str
    seed_a: int
    seed_b: int
    year: int


class BracketTeam(BaseModel):
    name: str
    seed: int
    region: str


class BracketRequest(BaseModel):
    teams: list[BracketTeam]
    year: int
    simulations: int = 10_000


@app.get("/teams")
def get_teams(year: int = 2026):
    try:
        df = service.get_team_features(year)
        return {"teams": df["team"].tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/game/predict")
def predict_game(req: MatchupRequest):
    try:
        features = service.build_matchup_features(
            req.team_a, req.team_b, req.seed_a, req.seed_b, req.year
        )
        prob = predict_win_prob(features)
        return {
            "team_a": req.team_a,
            "team_b": req.team_b,
            "prob_team_a_wins": round(prob, 4),
            "prob_team_b_wins": round(1 - prob, 4),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bracket/simulate")
def simulate(req: BracketRequest):
    if len(req.teams) != 64:
        raise HTTPException(status_code=400, detail="Bracket must have exactly 64 teams.")
    try:
        bracket = [Team(name=t.name, seed=t.seed, region=t.region) for t in req.teams]
        probs = simulate_bracket(bracket, req.year, service, req.simulations)
        return {"probabilities": probs}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
