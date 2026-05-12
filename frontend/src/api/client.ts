import type { BracketProbabilities, MatchupPrediction, Team } from "../types/bracket";

const BASE_URL = "http://localhost:8000";

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export const api = {
  getTeams: (year: number) =>
    get<{ teams: string[] }>("/teams", { year: String(year) }),

  predictGame: (teamA: string, teamB: string, seedA: number, seedB: number, year: number) =>
    post<MatchupPrediction>("/game/predict", {
      team_a: teamA,
      team_b: teamB,
      seed_a: seedA,
      seed_b: seedB,
      year,
    }),

  simulateBracket: (teams: Team[], year: number, simulations = 10_000) =>
    post<{ probabilities: BracketProbabilities }>("/bracket/simulate", {
      teams,
      year,
      simulations,
    }),
};
