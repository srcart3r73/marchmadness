import type { Team, BracketProbabilities } from "../../types/bracket";

interface Props {
  teamA: Team;
  teamB: Team;
  probabilities: BracketProbabilities;
  onPickWinner: (winner: Team) => void;
}

const ROUNDS = ["Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship", "Champion"] as const;

export function Matchup({ teamA, teamB, probabilities, onPickWinner }: Props) {
  const probA = probabilities[teamA.name];
  const probB = probabilities[teamB.name];

  return (
    <div className="matchup">
      {[{ team: teamA, prob: probA }, { team: teamB, prob: probB }].map(({ team, prob }) => (
        <button
          key={team.name}
          className="team-row"
          onClick={() => onPickWinner(team)}
          title={
            prob
              ? ROUNDS.map((r) => `${r}: ${((prob[r] ?? 0) * 100).toFixed(1)}%`).join("\n")
              : undefined
          }
        >
          <span className="seed">{team.seed}</span>
          <span className="name">{team.name}</span>
          {prob && (
            <span className="win-pct">
              {((prob["Champion"] ?? 0) * 100).toFixed(1)}% champ
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
