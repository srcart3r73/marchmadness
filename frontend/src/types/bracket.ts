export interface Team {
  name: string;
  seed: number;
  region: "East" | "West" | "South" | "Midwest";
}

export interface RoundProbabilities {
  "Round of 64": number;
  "Round of 32": number;
  "Sweet 16": number;
  "Elite 8": number;
  "Final Four": number;
  Championship: number;
  Champion: number;
}

export interface BracketProbabilities {
  [teamName: string]: RoundProbabilities;
}

export interface MatchupPrediction {
  team_a: string;
  team_b: string;
  prob_team_a_wins: number;
  prob_team_b_wins: number;
}
