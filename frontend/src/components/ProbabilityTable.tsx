import type { BracketProbabilities } from "../types/bracket";

const ROUNDS = [
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final Four",
  "Championship",
  "Champion",
] as const;

interface Props {
  probabilities: BracketProbabilities;
}

export function ProbabilityTable({ probabilities }: Props) {
  const teams = Object.entries(probabilities).sort(
    (a, b) => (b[1].Champion ?? 0) - (a[1].Champion ?? 0)
  );

  return (
    <table className="prob-table">
      <thead>
        <tr>
          <th>Team</th>
          {ROUNDS.map((r) => <th key={r}>{r}</th>)}
        </tr>
      </thead>
      <tbody>
        {teams.map(([team, probs]) => (
          <tr key={team}>
            <td>{team}</td>
            {ROUNDS.map((r) => (
              <td key={r}>{((probs[r] ?? 0) * 100).toFixed(1)}%</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
