import { useState } from "react";
import { api } from "./api/client";
import { ProbabilityTable } from "./components/ProbabilityTable";
import type { BracketProbabilities, Team } from "./types/bracket";

export default function App() {
  const [probabilities, setProbabilities] = useState<BracketProbabilities | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulation(teams: Team[]) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.simulateBracket(teams, 2026);
      setProbabilities(result.probabilities);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>March Madness 2026</h1>
      <p>Bracket probability calculator powered by ML</p>

      {/* TODO: replace with full BracketView component */}
      <button onClick={() => runSimulation([])} disabled={loading}>
        {loading ? "Simulating…" : "Run Simulation"}
      </button>

      {error && <p className="error">{error}</p>}
      {probabilities && <ProbabilityTable probabilities={probabilities} />}
    </div>
  );
}
