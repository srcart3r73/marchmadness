"""
Monte Carlo bracket simulator.
Runs N simulations of the full 64-team bracket and returns
per-team probabilities of reaching each round.
"""
import random
from collections import defaultdict
from dataclasses import dataclass

from model.predictor import predict_win_prob
from services.data_service import DataService

ROUNDS = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship", "Champion"]

# Standard NCAA bracket seeding order within a region (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
SEED_MATCHUP_ORDER = [(1, 16), (8, 9), (5, 12), (4, 13), (6, 11), (3, 14), (7, 10), (2, 15)]


@dataclass
class Team:
    name: str
    seed: int
    region: str


def simulate_game(team_a: Team, team_b: Team, features_by_team: dict, year: int, service: DataService) -> Team:
    matchup = service.build_matchup_features(
        team_a.name, team_b.name, team_a.seed, team_b.seed,
        year=year, team_features=features_by_team.get("df"),
    )
    p_a_wins = predict_win_prob(matchup)
    return team_a if random.random() < p_a_wins else team_b


def simulate_bracket(bracket: list[Team], year: int, service: DataService, n_simulations: int = 10_000) -> dict:
    """
    bracket: list of 64 Team objects in standard NCAA bracket order (4 regions × 16 teams).
    Returns dict[team_name][round_name] = probability (0.0–1.0).
    """
    team_features_df = service.get_team_features(year)
    ctx = {"df": team_features_df}

    reach_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for _ in range(n_simulations):
        _simulate_once(bracket, year, service, ctx, reach_counts)

    return {
        team: {
            round_name: reach_counts[team][round_name] / n_simulations
            for round_name in ROUNDS
        }
        for team in reach_counts
    }


def _simulate_once(bracket, year, service, ctx, reach_counts):
    survivors = list(bracket)

    for round_idx, round_name in enumerate(ROUNDS[:-1]):
        next_round = []
        for i in range(0, len(survivors), 2):
            team_a = survivors[i]
            team_b = survivors[i + 1]
            winner = simulate_game(team_a, team_b, ctx, year, service)
            reach_counts[winner.name][ROUNDS[round_idx + 1]] += 1
            next_round.append(winner)
        survivors = next_round

    if survivors:
        reach_counts[survivors[0].name]["Champion"] += 1
