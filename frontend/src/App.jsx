import { useState } from "react";

// ─── DYNAMIC DATA LAYER ────────────────────────────────────────────────────────
import TEAMS from "./react_teams.json";
import TEAM_PROBS from "./react_team_probs.json";

const REGIONS = ["East", "West", "South", "Midwest"];

const ROUND_LABELS = {
  r64: "Round of 64",
  r32: "Round of 32",
  s16: "Sweet 16",
  e8: "Elite Eight",
  f4: "Final Four",
  f2: "Championship",
  champ: "Champion",
};

const PCT = (v) => `${Math.round(v * 100)}%`;

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

const TeamBadge = ({ team, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: team.color || "#1d6ecc",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.32, fontWeight: 900, color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: -0.5, flexShrink: 0,
    boxShadow: `0 0 0 2px rgba(255,255,255,0.15)`,
  }}>
    {team.name.slice(0, 2).toUpperCase()}
  </div>
);

// ─── TEAM DETAIL PAGE ─────────────────────────────────────────────────────────
const TeamDetail = ({ team, onBack }) => {
  const probs = TEAM_PROBS[team.id] || { r64: 0, r32: 0, s16: 0, e8: 0, f4: 0, f2: 0, champ: 0 };
  const rounds = Object.entries(ROUND_LABELS);

  return (
    <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
        <div style={{ background: "#090e1a", marginTop: 2, padding: "28px 32px 24px" }}>
          <button onClick={onBack} style={{
            background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
            padding: "6px 18px", borderRadius: 4, cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
            marginBottom: 20, textTransform: "uppercase"
          }}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <TeamBadge team={team} size={64} />
            <div>
              <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase" }}>
                #{team.seed} seed · {team.region} Region
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>{team.name}</div>
              <div style={{ fontSize: 16, color: "#8ab4d8", marginTop: 4 }}>
                Monte Carlo Championship Probability: <span style={{ color: "#5aabff", fontWeight: 700 }}>{PCT(probs.champ)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 32px 64px" }}>
        <div style={{ fontSize: 13, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
          Round-by-Round Win Probabilities
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rounds.map(([key, label], i) => {
            const p = probs[key] || 0;
            return (
              <div key={key} style={{
                background: "#0d1526", border: "1px solid #1a2d4a",
                borderRadius: 10, overflow: "hidden",
                opacity: p < 0.05 ? 0.5 : 1,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "rgba(29,110,204,0.06)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 4,
                      background: "#1d6ecc", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 12, fontWeight: 700
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>{label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: p >= 0.6 ? "#4ade80" : p >= 0.35 ? "#facc15" : "#f87171", lineHeight: 1 }}>
                      {PCT(p)}
                    </div>
                    <div style={{ fontSize: 11, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: 1 }}>advance prob</div>
                  </div>
                </div>
                <div style={{ height: 4, background: "#1a2d4a" }}>
                  <div style={{
                    height: "100%", width: PCT(p),
                    background: p >= 0.6 ? "linear-gradient(90deg,#22c55e,#4ade80)" :
                      p >= 0.35 ? "linear-gradient(90deg,#d97706,#facc15)" :
                        "linear-gradient(90deg,#dc2626,#f87171)",
                    transition: "width 1s ease"
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── UPSET WATCH COMPONENT ────────────────────────────────────────────────────
const UpsetWatch = () => {
  // Find all double-digit seeds with an unusually high probability of winning Round 1
  const upsetAlerts = TEAMS.filter(t => t.seed >= 10 && TEAM_PROBS[t.id] && TEAM_PROBS[t.id].r64 >= 0.25)
    .sort((a, b) => TEAM_PROBS[b.id].r64 - TEAM_PROBS[a.id].r64);

  if (upsetAlerts.length === 0) return null;

  return (
    <div style={{ marginTop: 24, marginBottom: 40, width: "100%" }}>
      <div style={{ 
        fontSize: 14, color: "#f87171", letterSpacing: 4, textTransform: "uppercase", 
        marginBottom: 16, textAlign: "center", fontWeight: 800 
      }}>
        🚨 Upset Watch: High-Risk 1st Round Matchups 🚨
      </div>
      <div style={{ 
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 
      }}>
        {upsetAlerts.map(team => {
          const prob = TEAM_PROBS[team.id].r64;
          return (
            <div key={team.id} style={{ 
              background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.4)", 
              borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 
            }}>
              {/* <div style={{ fontSize: 24 }}>👀</div> */}
              <div>
                <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 700 }}>#{team.seed} {team.name}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
                  <span style={{ color: "#f87171" }}>{PCT(prob)}</span> Win Prob
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── UPDATED MULTI-DIRECTIONAL BRACKET PAGE ───────────────────────────────────

const MatchupRow = ({ matchup, roundKey, reverse = false }) => {
  const t1 = TEAMS.find(t => t.id === matchup?.t1);
  const t2 = TEAMS.find(t => t.id === matchup?.t2);
  
  if (!t1 && !t2) return <div style={{ height: 52, marginBottom: 8, width: 170, flexShrink: 0 }} />;

  const p1 = t1 && TEAM_PROBS[t1.id] ? TEAM_PROBS[t1.id][roundKey] : 0;
  const p2 = t2 && TEAM_PROBS[t2.id] ? TEAM_PROBS[t2.id][roundKey] : 0;

  const totalProb = p1 + p2;
  const displayP1 = totalProb > 0 ? p1 / totalProb : 0.5;
  const displayP2 = totalProb > 0 ? p2 / totalProb : 0.5;

  const getHighlight = (prob) => prob >= 0.5 ? "rgba(74,222,128,0.12)" : "transparent";
  const getTextColor = (prob) => prob >= 0.5 ? "#4ade80" : "#fff";

  const TeamRow = ({ team, prob }) => {
    if (!team) return <div style={{ height: 26, padding: "4px 8px" }} />;
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "5px 8px",
        background: getHighlight(prob),
        flexDirection: reverse ? "row-reverse" : "row",
        transition: "background 0.3s"
      }}>
        <span style={{ fontSize: 10, color: "#4a6a8a", width: 12, textAlign: "center" }}>{team.seed}</span>
        <TeamBadge team={team} size={16} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: getTextColor(prob), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: reverse ? "right" : "left" }}>
          {team.name}
        </span>
        <div style={{ textAlign: reverse ? "left" : "right", width: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: prob >= 0.6 ? "#4ade80" : prob >= 0.4 ? "#facc15" : "#f87171" }}>
            {PCT(prob)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
      overflow: "hidden", marginBottom: 8, width: 170, flexShrink: 0
    }}>
      <TeamRow team={t1} prob={displayP1} />
      <div style={{ height: 1, background: "#1a2d4a" }} />
      <TeamRow team={t2} prob={displayP2} />
    </div>
  );
};

const BracketPage = ({ onBack }) => {
  const getWinner = (t1Id, t2Id, targetRoundKey) => {
    if (!t1Id) return t2Id;
    if (!t2Id) return t1Id;
    const p1 = TEAM_PROBS[t1Id]?.[targetRoundKey] || 0;
    const p2 = TEAM_PROBS[t2Id]?.[targetRoundKey] || 0;
    return p1 > p2 ? t1Id : t2Id;
  };

  const regionsData = REGIONS.map(region => {
    const regionTeams = TEAMS.filter(t => t.region === region);
    const TOPOLOGY = [[1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]];
    
    const r64Matchups = TOPOLOGY.map(([s1, s2]) => ({
      t1: regionTeams.find(t => t.seed === s1)?.id,
      t2: regionTeams.find(t => t.seed === s2)?.id
    }));

    const r32Matchups = [];
    for(let i=0; i<8; i+=2) r32Matchups.push({ t1: getWinner(r64Matchups[i].t1, r64Matchups[i].t2, "r32"), t2: getWinner(r64Matchups[i+1].t1, r64Matchups[i+1].t2, "r32") });

    const s16Matchups = [];
    for(let i=0; i<4; i+=2) s16Matchups.push({ t1: getWinner(r32Matchups[i].t1, r32Matchups[i].t2, "s16"), t2: getWinner(r32Matchups[i+1].t1, r32Matchups[i+1].t2, "s16") });

    const e8Matchups = [{ t1: getWinner(s16Matchups[0].t1, s16Matchups[0].t2, "e8"), t2: getWinner(s16Matchups[1].t1, s16Matchups[1].t2, "e8") }];

    const regionWinner = getWinner(e8Matchups[0].t1, e8Matchups[0].t2, "f4");

    return {
      region,
      regionWinner,
      columns: [
        { round: "r64", data: r64Matchups },
        { round: "r32", data: r32Matchups },
        { round: "s16", data: s16Matchups },
        { round: "e8", data: e8Matchups }
      ]
    };
  });

  const f4_game1 = { t1: regionsData[0].regionWinner, t2: regionsData[1].regionWinner };
  const f4_game2 = { t1: regionsData[2].regionWinner, t2: regionsData[3].regionWinner };
  
  const f2_t1 = getWinner(f4_game1.t1, f4_game1.t2, "f2");
  const f2_t2 = getWinner(f4_game2.t1, f4_game2.t2, "f2");
  const champ_matchup = { t1: f2_t1, t2: f2_t2 };
  
  const championId = getWinner(champ_matchup.t1, champ_matchup.t2, "champ");
  const championTeam = TEAMS.find(t => t.id === championId);

  const RegionBlock = ({ data, reverse }) => (
    <div style={{ background: "rgba(13, 21, 38, 0.4)", padding: 16, borderRadius: 12, border: "1px solid #1a2d4a" }}>
      <div style={{
        fontSize: 14, color: "#5aabff", letterSpacing: 4, fontWeight: 800,
        textTransform: "uppercase", marginBottom: 16, textAlign: reverse ? "right" : "left"
      }}>
        {data.region} REGION
      </div>
      <div style={{ display: "flex", flexDirection: reverse ? "row-reverse" : "row", gap: 12 }}>
        {data.columns.map((col, colIndex) => (
          <div key={colIndex} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
            {col.data.map((m, i) => (
              <MatchupRow key={i} matchup={m} roundKey={col.round} reverse={reverse} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
        <div style={{ background: "#090e1a", marginTop: 2, padding: "20px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={onBack} style={{
              background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
              padding: "6px 18px", borderRadius: 4, cursor: "pointer",
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
              textTransform: "uppercase"
            }}>← Back</button>

            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>NCAA</div>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>STANDARD BRACKET VIEW</div>
            </div>
            
            <div style={{ width: 80 }}></div> 
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", padding: "32px", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", gap: 24, width: "max-content", margin: "0 auto", padding: "0 20px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
            <RegionBlock data={regionsData[0]} reverse={false} />
            <RegionBlock data={regionsData[1]} reverse={false} />
          </div>

          <div style={{ 
            width: 220, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            alignItems: "center", 
            gap: 24, 
            flexShrink: 0 
          }}>
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#5aabff", letterSpacing: 2 }}>FINAL FOUR</div>
            <MatchupRow matchup={f4_game1} roundKey="f4" reverse={false} />
            <MatchupRow matchup={f4_game2} roundKey="f4" reverse={true} />

            <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#facc15", letterSpacing: 2, marginTop: 16 }}>CHAMPIONSHIP</div>
            <MatchupRow matchup={champ_matchup} roundKey="f2" reverse={false} />

            {championTeam && (
              <div style={{ 
                textAlign: "center", marginTop: 24, background: "rgba(74, 222, 128, 0.1)", 
                padding: "20px 10px", borderRadius: 12, border: "1px solid #4ade80",
                width: "100%", 
                boxSizing: "border-box"
              }}>
                <div style={{ fontSize: 12, color: "#4ade80", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>NATIONAL CHAMPION</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <TeamBadge team={championTeam} size={64} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{championTeam.name}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
            <RegionBlock data={regionsData[2]} reverse={true} />
            <RegionBlock data={regionsData[3]} reverse={true} />
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const MainPage = ({ onSelectTeam, onBracket }) => {
  const [search, setSearch] = useState("");

  const filtered = TEAMS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
      <div style={{
        background: "linear-gradient(135deg, #1d6ecc 0%, #0d3d73 60%, #090e1a 100%)",
        padding: "0 0 3px"
      }}>
        <div style={{ background: "#090e1a", marginTop: 3 }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto", padding: "40px 32px 32px",
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 11, letterSpacing: 5, color: "#5aabff", textTransform: "uppercase", marginBottom: 8 }}>
              NCAA Tournament
            </div>
            <div style={{
              fontSize: 72, fontWeight: 900, lineHeight: 0.88,
              letterSpacing: -2, textTransform: "uppercase",
              background: "linear-gradient(180deg, #fff 40%, #5aabff 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              MARCH<br />MADNESS
            </div>
            <div style={{
              fontSize: 16, color: "#4a6a8a", marginTop: 10, letterSpacing: 2,
              textTransform: "uppercase"
            }}>
              XGBoost Prediction Model
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
              <button onClick={onBracket} style={{
                background: "linear-gradient(135deg, #1d6ecc, #0a5aad)",
                border: "none", color: "#fff", padding: "12px 32px",
                borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 700,
                letterSpacing: 1.5, textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
                boxShadow: "0 4px 20px rgba(29,110,204,0.4)",
              }}>
                View Full Bracket →
              </button>
              <div style={{
                display: "flex", alignItems: "center",
                background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
                padding: "0 16px", gap: 8
              }}>
                <span style={{ color: "#4a6a8a", fontSize: 16 }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search teams..."
                  style={{
                    background: "none", border: "none", color: "#fff", fontSize: 16,
                    fontFamily: "'Barlow Condensed', sans-serif", outline: "none", width: 160
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
        
        {/* Render the Upset Watch right above the Regions grid */}
        <UpsetWatch />
        
        {/* The 4 Regions Grid */}
        {REGIONS.map(region => {
          const regionTeams = filtered.filter(t => t.region === region);
          if (!regionTeams.length) return null;
          return (
            <div key={region} style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>
                  {region} Region
                </div>
                <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 10
              }}>
                {regionTeams
                  .sort((a, b) => a.seed - b.seed)
                  .map(team => {
                    const p = TEAM_PROBS[team.id] || { r64: 0, s16: 0, champ: 0 };
                    return (
                      <button
                        key={team.id}
                        onClick={() => onSelectTeam(team)}
                        style={{
                          background: "#0d1526", border: "1px solid #1a2d4a",
                          borderRadius: 10, padding: "14px 16px",
                          cursor: "pointer", textAlign: "left",
                          color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
                          transition: "all 0.2s ease",
                          position: "relative", overflow: "hidden",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = team.color || "#1d6ecc";
                          e.currentTarget.style.background = "#111d35";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = "#1a2d4a";
                          e.currentTarget.style.background = "#0d1526";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#4a6a8a", fontWeight: 700 }}>
                          #{team.seed}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <TeamBadge team={team} size={32} />
                          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{team.name}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {[["r64", "R64"], ["s16", "S16"], ["champ", "🏆"]].map(([key, lbl]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ fontSize: 10, color: "#4a6a8a", width: 24 }}>{lbl}</div>
                              <div style={{ flex: 1, height: 4, background: "#1a2d4a", borderRadius: 2 }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  width: PCT(p[key]),
                                  background: key === "champ" ? `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)` : "#1d6ecc"
                                }} />
                              </div>
                              <div style={{ fontSize: 11, color: "#5aabff", width: 32, textAlign: "right", fontWeight: 700 }}>
                                {PCT(p[key])}
                              </div>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 60, borderTop: "1px solid #1a2d4a", paddingTop: 40 }}>
          <div style={{ fontSize: 14, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase", marginBottom: 24, textAlign: "center", fontWeight: 800 }}>
            Model Favorites: Top 8 Championship Contenders
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
            {[...TEAMS]
              .sort((a, b) => (TEAM_PROBS[b.id]?.champ || 0) - (TEAM_PROBS[a.id]?.champ || 0))
              .slice(0, 8)
              .map((team, i) => {
                const p = TEAM_PROBS[team.id]?.champ || 0;
                return (
                  <div key={team.id} style={{ 
                    display: "flex", alignItems: "center", gap: 14, 
                    background: "#0d1526", padding: "12px 20px", 
                    borderRadius: 8, border: "1px solid #1a2d4a" 
                  }}>
                    <span style={{ fontSize: 14, color: "#4a6a8a", width: 20, textAlign: "right", fontWeight: 700 }}>#{i + 1}</span>
                    <TeamBadge team={team} size={32} />
                    <span style={{ width: 140, fontSize: 16, fontWeight: 700 }}>{team.name}</span>
                    <div style={{ flex: 1, height: 8, background: "#090e1a", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${Math.round(p * 100 * 5)}%`, 
                        background: `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)`,
                        maxWidth: "100%"
                      }} />
                    </div>
                    <span style={{ width: 44, textAlign: "right", fontSize: 18, fontWeight: 900, color: "#5aabff" }}>{PCT(p)}</span>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState("main");
  const [selectedTeam, setSelectedTeam] = useState(null);

  if (typeof document !== "undefined") {
    const existing = document.getElementById("march-madness-fonts");
    if (!existing) {
      const link = document.createElement("link");
      link.id = "march-madness-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }
  }

  if (page === "team" && selectedTeam) return <TeamDetail team={selectedTeam} onBack={() => setPage("main")} />;
  if (page === "bracket") return <BracketPage onBack={() => setPage("main")} />;
  return <MainPage onSelectTeam={team => { setSelectedTeam(team); setPage("team"); }} onBracket={() => setPage("bracket")} />;
}
// import { useState } from "react";

// // ─── DYNAMIC DATA LAYER ────────────────────────────────────────────────────────
// import TEAMS from "./react_teams.json";
// import TEAM_PROBS from "./react_team_probs.json";

// const REGIONS = ["East", "West", "South", "Midwest"];

// const ROUND_LABELS = {
//   r64: "Round of 64",
//   r32: "Round of 32",
//   s16: "Sweet 16",
//   e8: "Elite Eight",
//   f4: "Final Four",
//   f2: "Championship",
//   champ: "Champion",
// };

// const PCT = (v) => `${Math.round(v * 100)}%`;

// // ─── COMPONENTS ────────────────────────────────────────────────────────────────

// const TeamBadge = ({ team, size = 36 }) => (
//   <div style={{
//     width: size, height: size, borderRadius: "50%",
//     background: team.color || "#1d6ecc",
//     display: "flex", alignItems: "center", justifyContent: "center",
//     fontSize: size * 0.32, fontWeight: 900, color: "#fff",
//     fontFamily: "'Barlow Condensed', sans-serif",
//     letterSpacing: -0.5, flexShrink: 0,
//     boxShadow: `0 0 0 2px rgba(255,255,255,0.15)`,
//   }}>
//     {team.name.slice(0, 2).toUpperCase()}
//   </div>
// );

// // ─── TEAM DETAIL PAGE ─────────────────────────────────────────────────────────
// const TeamDetail = ({ team, onBack }) => {
//   const probs = TEAM_PROBS[team.id] || { r64: 0, r32: 0, s16: 0, e8: 0, f4: 0, f2: 0, champ: 0 };
//   const rounds = Object.entries(ROUND_LABELS);

//   return (
//     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
//       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
//         <div style={{ background: "#090e1a", marginTop: 2, padding: "28px 32px 24px" }}>
//           <button onClick={onBack} style={{
//             background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
//             padding: "6px 18px", borderRadius: 4, cursor: "pointer",
//             fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
//             marginBottom: 20, textTransform: "uppercase"
//           }}>← Back</button>
//           <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
//             <TeamBadge team={team} size={64} />
//             <div>
//               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase" }}>
//                 #{team.seed} seed · {team.region} Region
//               </div>
//               <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>{team.name}</div>
//               <div style={{ fontSize: 16, color: "#8ab4d8", marginTop: 4 }}>
//                 Monte Carlo Championship Probability: <span style={{ color: "#5aabff", fontWeight: 700 }}>{PCT(probs.champ)}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div style={{ padding: "32px 32px 64px" }}>
//         <div style={{ fontSize: 13, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
//           Round-by-Round Win Probabilities
//         </div>

//         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//           {rounds.map(([key, label], i) => {
//             const p = probs[key] || 0;
//             return (
//               <div key={key} style={{
//                 background: "#0d1526", border: "1px solid #1a2d4a",
//                 borderRadius: 10, overflow: "hidden",
//                 opacity: p < 0.05 ? 0.5 : 1,
//               }}>
//                 <div style={{
//                   display: "flex", alignItems: "center", justifyContent: "space-between",
//                   padding: "16px 20px", background: "rgba(29,110,204,0.06)"
//                 }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//                     <div style={{
//                       width: 28, height: 28, borderRadius: 4,
//                       background: "#1d6ecc", display: "flex", alignItems: "center",
//                       justifyContent: "center", fontSize: 12, fontWeight: 700
//                     }}>{i + 1}</div>
//                     <div>
//                       <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>{label}</div>
//                     </div>
//                   </div>
//                   <div style={{ textAlign: "right" }}>
//                     <div style={{ fontSize: 36, fontWeight: 900, color: p >= 0.6 ? "#4ade80" : p >= 0.35 ? "#facc15" : "#f87171", lineHeight: 1 }}>
//                       {PCT(p)}
//                     </div>
//                     <div style={{ fontSize: 11, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: 1 }}>advance prob</div>
//                   </div>
//                 </div>
//                 <div style={{ height: 4, background: "#1a2d4a" }}>
//                   <div style={{
//                     height: "100%", width: PCT(p),
//                     background: p >= 0.6 ? "linear-gradient(90deg,#22c55e,#4ade80)" :
//                       p >= 0.35 ? "linear-gradient(90deg,#d97706,#facc15)" :
//                         "linear-gradient(90deg,#dc2626,#f87171)",
//                     transition: "width 1s ease"
//                   }} />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── UPDATED MULTI-DIRECTIONAL BRACKET PAGE ───────────────────────────────────

// const MatchupRow = ({ matchup, roundKey, reverse = false }) => {
//   const t1 = TEAMS.find(t => t.id === matchup?.t1);
//   const t2 = TEAMS.find(t => t.id === matchup?.t2);
  
//   if (!t1 && !t2) return <div style={{ height: 52, marginBottom: 8, width: 170, flexShrink: 0 }} />;

//   const p1 = t1 && TEAM_PROBS[t1.id] ? TEAM_PROBS[t1.id][roundKey] : 0;
//   const p2 = t2 && TEAM_PROBS[t2.id] ? TEAM_PROBS[t2.id][roundKey] : 0;

//   const totalProb = p1 + p2;
//   const displayP1 = totalProb > 0 ? p1 / totalProb : 0.5;
//   const displayP2 = totalProb > 0 ? p2 / totalProb : 0.5;

//   const getHighlight = (prob) => prob >= 0.5 ? "rgba(74,222,128,0.12)" : "transparent";
//   const getTextColor = (prob) => prob >= 0.5 ? "#4ade80" : "#fff";

//   const TeamRow = ({ team, prob }) => {
//     if (!team) return <div style={{ height: 26, padding: "4px 8px" }} />;
//     return (
//       <div style={{
//         display: "flex", alignItems: "center", gap: 6, padding: "5px 8px",
//         background: getHighlight(prob),
//         flexDirection: reverse ? "row-reverse" : "row", // Mirrors the content for the right side of the bracket!
//         transition: "background 0.3s"
//       }}>
//         <span style={{ fontSize: 10, color: "#4a6a8a", width: 12, textAlign: "center" }}>{team.seed}</span>
//         <TeamBadge team={team} size={16} />
//         <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: getTextColor(prob), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: reverse ? "right" : "left" }}>
//           {team.name}
//         </span>
//         <div style={{ textAlign: reverse ? "left" : "right", width: 28 }}>
//           <div style={{ fontSize: 11, fontWeight: 800, color: prob >= 0.6 ? "#4ade80" : prob >= 0.4 ? "#facc15" : "#f87171" }}>
//             {PCT(prob)}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{
//       background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
//       overflow: "hidden", marginBottom: 8, width: 170, flexShrink: 0
//     }}>
//       <TeamRow team={t1} prob={displayP1} />
//       <div style={{ height: 1, background: "#1a2d4a" }} />
//       <TeamRow team={t2} prob={displayP2} />
//     </div>
//   );
// };

// const BracketPage = ({ onBack }) => {
//   // Uses target round probability to mathematically advance teams
//   const getWinner = (t1Id, t2Id, targetRoundKey) => {
//     if (!t1Id) return t2Id;
//     if (!t2Id) return t1Id;
//     const p1 = TEAM_PROBS[t1Id]?.[targetRoundKey] || 0;
//     const p2 = TEAM_PROBS[t2Id]?.[targetRoundKey] || 0;
//     return p1 > p2 ? t1Id : t2Id;
//   };

//   // 1. Process all 4 regions dynamically
//   const regionsData = REGIONS.map(region => {
//     const regionTeams = TEAMS.filter(t => t.region === region);
//     const TOPOLOGY = [[1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]];
    
//     const r64Matchups = TOPOLOGY.map(([s1, s2]) => ({
//       t1: regionTeams.find(t => t.seed === s1)?.id,
//       t2: regionTeams.find(t => t.seed === s2)?.id
//     }));

//     const r32Matchups = [];
//     for(let i=0; i<8; i+=2) r32Matchups.push({ t1: getWinner(r64Matchups[i].t1, r64Matchups[i].t2, "r32"), t2: getWinner(r64Matchups[i+1].t1, r64Matchups[i+1].t2, "r32") });

//     const s16Matchups = [];
//     for(let i=0; i<4; i+=2) s16Matchups.push({ t1: getWinner(r32Matchups[i].t1, r32Matchups[i].t2, "s16"), t2: getWinner(r32Matchups[i+1].t1, r32Matchups[i+1].t2, "s16") });

//     const e8Matchups = [{ t1: getWinner(s16Matchups[0].t1, s16Matchups[0].t2, "e8"), t2: getWinner(s16Matchups[1].t1, s16Matchups[1].t2, "e8") }];

//     // The team that wins the Elite 8 goes to the Final Four
//     const regionWinner = getWinner(e8Matchups[0].t1, e8Matchups[0].t2, "f4");

//     return {
//       region,
//       regionWinner,
//       columns: [
//         { round: "r64", data: r64Matchups },
//         { round: "r32", data: r32Matchups },
//         { round: "s16", data: s16Matchups },
//         { round: "e8", data: e8Matchups }
//       ]
//     };
//   });

//   // 2. Final Four & Championship Processing
//   const f4_game1 = { t1: regionsData[0].regionWinner, t2: regionsData[1].regionWinner }; // East vs West
//   const f4_game2 = { t1: regionsData[2].regionWinner, t2: regionsData[3].regionWinner }; // South vs Midwest
  
//   const f2_t1 = getWinner(f4_game1.t1, f4_game1.t2, "f2");
//   const f2_t2 = getWinner(f4_game2.t1, f4_game2.t2, "f2");
//   const champ_matchup = { t1: f2_t1, t2: f2_t2 };
  
//   const championId = getWinner(champ_matchup.t1, champ_matchup.t2, "champ");
//   const championTeam = TEAMS.find(t => t.id === championId);

//   // 3. Reusable Bracket Block Component
//   const RegionBlock = ({ data, reverse }) => (
//     <div style={{ background: "rgba(13, 21, 38, 0.4)", padding: 16, borderRadius: 12, border: "1px solid #1a2d4a" }}>
//       <div style={{
//         fontSize: 14, color: "#5aabff", letterSpacing: 4, fontWeight: 800,
//         textTransform: "uppercase", marginBottom: 16, textAlign: reverse ? "right" : "left"
//       }}>
//         {data.region} REGION
//       </div>
//       <div style={{ display: "flex", flexDirection: reverse ? "row-reverse" : "row", gap: 12 }}>
//         {data.columns.map((col, colIndex) => (
//           <div key={colIndex} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
//             {col.data.map((m, i) => (
//               <MatchupRow key={i} matchup={m} roundKey={col.round} reverse={reverse} />
//             ))}
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
//       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
//         <div style={{ background: "#090e1a", marginTop: 2, padding: "20px 32px" }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <button onClick={onBack} style={{
//               background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
//               padding: "6px 18px", borderRadius: 4, cursor: "pointer",
//               fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
//               textTransform: "uppercase"
//             }}>← Back</button>

//             <div style={{ textAlign: "center", flex: 1 }}>
//               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>NCAA</div>
//               <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>STANDARD BRACKET VIEW</div>
//             </div>
            
//             <div style={{ width: 80 }}></div> 
//           </div>
//         </div>
//       </div>

//       {/* HORIZONTAL SCROLL CONTAINER */}
//       <div style={{ overflowX: "auto", padding: "32px", WebkitOverflowScrolling: "touch" }}>
        
//         {/* MASSIVE BRACKET FLEXBOX - FIXED OVERFLOW CLIPPING */}
//         <div style={{ display: "flex", gap: 24, width: "max-content", margin: "0 auto", padding: "0 20px" }}>
          
//           {/* LEFT SIDE (East & West) */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
//             <RegionBlock data={regionsData[0]} reverse={false} />
//             <RegionBlock data={regionsData[1]} reverse={false} />
//           </div>
            
//           {/* CENTER COLUMN (Final Four & Championship) */}
//           <div style={{ 
//             width: 220, 
//             display: "flex", 
//             flexDirection: "column", 
//             justifyContent: "center", 
//             alignItems: "center", /* <--- THE MAGIC CENTERING FIX */
//             gap: 24, 
//             flexShrink: 0 
//           }}>
            
//             <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#5aabff", letterSpacing: 2 }}>FINAL FOUR</div>
//             <MatchupRow matchup={f4_game1} roundKey="f4" reverse={false} />
//             <MatchupRow matchup={f4_game2} roundKey="f4" reverse={true} />

//             <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#facc15", letterSpacing: 2, marginTop: 16 }}>CHAMPIONSHIP</div>
//             <MatchupRow matchup={champ_matchup} roundKey="f2" reverse={false} />

//             {championTeam && (
//               <div style={{ 
//                 textAlign: "center", marginTop: 24, background: "rgba(74, 222, 128, 0.1)", 
//                 padding: "20px 10px", borderRadius: 12, border: "1px solid #4ade80",
//                 width: "100%", /* Ensures the champion box spans the full 220px cleanly */
//                 boxSizing: "border-box"
//               }}>
//                 <div style={{ fontSize: 12, color: "#4ade80", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>NATIONAL CHAMPION</div>
//                 <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
//                   <TeamBadge team={championTeam} size={64} />
//                 </div>
//                 <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{championTeam.name}</div>
//               </div>
//             )}
//           </div>

//           {/* RIGHT SIDE (South & Midwest) - Uses `reverse={true}` to build toward the center! */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
//             <RegionBlock data={regionsData[2]} reverse={true} />
//             <RegionBlock data={regionsData[3]} reverse={true} />
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// const MainPage = ({ onSelectTeam, onBracket }) => {
//   const [search, setSearch] = useState("");

//   const filtered = TEAMS.filter(t =>
//     t.name.toLowerCase().includes(search.toLowerCase()) ||
//     t.region.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
//       <div style={{
//         background: "linear-gradient(135deg, #1d6ecc 0%, #0d3d73 60%, #090e1a 100%)",
//         padding: "0 0 3px"
//       }}>
//         <div style={{ background: "#090e1a", marginTop: 3 }}>
//           <div style={{
//             maxWidth: 1200, margin: "0 auto", padding: "40px 32px 32px",
//             display: "flex", flexDirection: "column", alignItems: "center",
//             textAlign: "center"
//           }}>
//             <div style={{ fontSize: 11, letterSpacing: 5, color: "#5aabff", textTransform: "uppercase", marginBottom: 8 }}>
//               NCAA Tournament
//             </div>
//             <div style={{
//               fontSize: 72, fontWeight: 900, lineHeight: 0.88,
//               letterSpacing: -2, textTransform: "uppercase",
//               background: "linear-gradient(180deg, #fff 40%, #5aabff 100%)",
//               WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
//             }}>
//               MARCH<br />MADNESS
//             </div>
//             <div style={{
//               fontSize: 16, color: "#4a6a8a", marginTop: 10, letterSpacing: 2,
//               textTransform: "uppercase"
//             }}>
//               XGBoost Prediction Model
//             </div>

//             <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
//               <button onClick={onBracket} style={{
//                 background: "linear-gradient(135deg, #1d6ecc, #0a5aad)",
//                 border: "none", color: "#fff", padding: "12px 32px",
//                 borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 700,
//                 letterSpacing: 1.5, textTransform: "uppercase",
//                 fontFamily: "'Barlow Condensed', sans-serif",
//                 boxShadow: "0 4px 20px rgba(29,110,204,0.4)",
//               }}>
//                 View Full Bracket →
//               </button>
//               <div style={{
//                 display: "flex", alignItems: "center",
//                 background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
//                 padding: "0 16px", gap: 8
//               }}>
//                 <span style={{ color: "#4a6a8a", fontSize: 16 }}>🔍</span>
//                 <input
//                   value={search}
//                   onChange={e => setSearch(e.target.value)}
//                   placeholder="Search teams..."
//                   style={{
//                     background: "none", border: "none", color: "#fff", fontSize: 16,
//                     fontFamily: "'Barlow Condensed', sans-serif", outline: "none", width: 160
//                   }}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>

//         // ─── UPSET WATCH COMPONENT ────────────────────────────────────────────────────
//         const UpsetWatch = () => {
//           // Find all double-digit seeds with an unusually high probability of winning Round 1
//           const upsetAlerts = TEAMS.filter(t => t.seed >= 10 && TEAM_PROBS[t.id] && TEAM_PROBS[t.id].r64 >= 0.25).sort((a, b) => TEAM_PROBS[b.id].r64 - TEAM_PROBS[a.id].r64);

//           if (upsetAlerts.length === 0) return null;

//           return (
//             <div style={{ marginTop: 24, marginBottom: 40, width: "100%" }}>
//               <div style={{ 
//                 fontSize: 14, color: "#f87171", letterSpacing: 4, textTransform: "uppercase", 
//                 marginBottom: 16, textAlign: "center", fontWeight: 800 
//               }}>
//                 🚨 Upset Watch: High-Risk 1st Round Matchups 🚨
//               </div>
//               <div style={{ 
//                 display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 
//               }}>
//                 {upsetAlerts.map(team => {
//                   const prob = TEAM_PROBS[team.id].r64;
//                   return (
//                     <div key={team.id} style={{ 
//                       background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.4)", 
//                       borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 
//                     }}>
//                       <div style={{ fontSize: 24 }}>👀</div>
//                       <div>
//                         <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 700 }}>#{team.seed} {team.name}</div>
//                         <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
//                           <span style={{ color: "#f87171" }}>{PCT(prob)}</span> Win Prob
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         };
        
//         {/* The 4 Regions Grid */}
//         {REGIONS.map(region => {
//           const regionTeams = filtered.filter(t => t.region === region);
//           if (!regionTeams.length) return null;
//           return (
//             <div key={region} style={{ marginBottom: 40 }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
//                 <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>
//                   {region} Region
//                 </div>
//                 <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
//               </div>

//               <div style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
//                 gap: 10
//               }}>
//                 {regionTeams
//                   .sort((a, b) => a.seed - b.seed)
//                   .map(team => {
//                     const p = TEAM_PROBS[team.id] || { r64: 0, s16: 0, champ: 0 };
//                     return (
//                       <button
//                         key={team.id}
//                         onClick={() => onSelectTeam(team)}
//                         style={{
//                           background: "#0d1526", border: "1px solid #1a2d4a",
//                           borderRadius: 10, padding: "14px 16px",
//                           cursor: "pointer", textAlign: "left",
//                           color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
//                           transition: "all 0.2s ease",
//                           position: "relative", overflow: "hidden",
//                         }}
//                         onMouseEnter={e => {
//                           e.currentTarget.style.borderColor = team.color || "#1d6ecc";
//                           e.currentTarget.style.background = "#111d35";
//                           e.currentTarget.style.transform = "translateY(-2px)";
//                         }}
//                         onMouseLeave={e => {
//                           e.currentTarget.style.borderColor = "#1a2d4a";
//                           e.currentTarget.style.background = "#0d1526";
//                           e.currentTarget.style.transform = "translateY(0)";
//                         }}
//                       >
//                         <div style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#4a6a8a", fontWeight: 700 }}>
//                           #{team.seed}
//                         </div>
//                         <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
//                           <TeamBadge team={team} size={32} />
//                           <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{team.name}</div>
//                         </div>
//                         <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//                           {[["r64", "R64"], ["s16", "S16"], ["champ", "🏆"]].map(([key, lbl]) => (
//                             <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                               <div style={{ fontSize: 10, color: "#4a6a8a", width: 24 }}>{lbl}</div>
//                               <div style={{ flex: 1, height: 4, background: "#1a2d4a", borderRadius: 2 }}>
//                                 <div style={{
//                                   height: "100%", borderRadius: 2,
//                                   width: PCT(p[key]),
//                                   background: key === "champ" ? `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)` : "#1d6ecc"
//                                 }} />
//                               </div>
//                               <div style={{ fontSize: 11, color: "#5aabff", width: 32, textAlign: "right", fontWeight: 700 }}>
//                                 {PCT(p[key])}
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </button>
//                     );
//                   })}
//               </div>
//             </div>
//           );
//         })}

//         {/* ─── NEW: CHAMPIONSHIP PROBABILITY BAR ON MAIN PAGE ─── */}
//         <div style={{ marginTop: 60, borderTop: "1px solid #1a2d4a", paddingTop: 40 }}>
//           <div style={{ fontSize: 14, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase", marginBottom: 24, textAlign: "center", fontWeight: 800 }}>
//             Model Favorites: Top 8 Championship Contenders
//           </div>
//           <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
//             {[...TEAMS]
//               .sort((a, b) => (TEAM_PROBS[b.id]?.champ || 0) - (TEAM_PROBS[a.id]?.champ || 0))
//               .slice(0, 8)
//               .map((team, i) => {
//                 const p = TEAM_PROBS[team.id]?.champ || 0;
//                 return (
//                   <div key={team.id} style={{ 
//                     display: "flex", alignItems: "center", gap: 14, 
//                     background: "#0d1526", padding: "12px 20px", 
//                     borderRadius: 8, border: "1px solid #1a2d4a" 
//                   }}>
//                     <span style={{ fontSize: 14, color: "#4a6a8a", width: 20, textAlign: "right", fontWeight: 700 }}>#{i + 1}</span>
//                     <TeamBadge team={team} size={32} />
//                     <span style={{ width: 140, fontSize: 16, fontWeight: 700 }}>{team.name}</span>
//                     <div style={{ flex: 1, height: 8, background: "#090e1a", borderRadius: 4, overflow: "hidden" }}>
//                       <div style={{
//                         height: "100%", borderRadius: 4,
//                         // Multiplied by 5 here to visually scale it up! A 20% prob will fill the bar.
//                         width: `${Math.round(p * 100 * 5)}%`, 
//                         background: `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)`,
//                         maxWidth: "100%"
//                       }} />
//                     </div>
//                     <span style={{ width: 44, textAlign: "right", fontSize: 18, fontWeight: 900, color: "#5aabff" }}>{PCT(p)}</span>
//                   </div>
//                 );
//               })}
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// // // ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// // const MainPage = ({ onSelectTeam, onBracket }) => {
// //   const [search, setSearch] = useState("");

// //   const filtered = TEAMS.filter(t =>
// //     t.name.toLowerCase().includes(search.toLowerCase()) ||
// //     t.region.toLowerCase().includes(search.toLowerCase())
// //   );

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{
// //         background: "linear-gradient(135deg, #1d6ecc 0%, #0d3d73 60%, #090e1a 100%)",
// //         padding: "0 0 3px"
// //       }}>
// //         <div style={{ background: "#090e1a", marginTop: 3 }}>
// //           <div style={{
// //             maxWidth: 1200, margin: "0 auto", padding: "40px 32px 32px",
// //             display: "flex", flexDirection: "column", alignItems: "center",
// //             textAlign: "center"
// //           }}>
// //             <div style={{ fontSize: 11, letterSpacing: 5, color: "#5aabff", textTransform: "uppercase", marginBottom: 8 }}>
// //               NCAA Tournament
// //             </div>
// //             <div style={{
// //               fontSize: 72, fontWeight: 900, lineHeight: 0.88,
// //               letterSpacing: -2, textTransform: "uppercase",
// //               background: "linear-gradient(180deg, #fff 40%, #5aabff 100%)",
// //               WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
// //             }}>
// //               MARCH<br />MADNESS
// //             </div>
// //             <div style={{
// //               fontSize: 16, color: "#4a6a8a", marginTop: 10, letterSpacing: 2,
// //               textTransform: "uppercase"
// //             }}>
// //               XGBoost Prediction Model
// //             </div>

// //             <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
// //               <button onClick={onBracket} style={{
// //                 background: "linear-gradient(135deg, #1d6ecc, #0a5aad)",
// //                 border: "none", color: "#fff", padding: "12px 32px",
// //                 borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 700,
// //                 letterSpacing: 1.5, textTransform: "uppercase",
// //                 fontFamily: "'Barlow Condensed', sans-serif",
// //                 boxShadow: "0 4px 20px rgba(29,110,204,0.4)",
// //               }}>
// //                 View Full Bracket →
// //               </button>
// //               <div style={{
// //                 display: "flex", alignItems: "center",
// //                 background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
// //                 padding: "0 16px", gap: 8
// //               }}>
// //                 <span style={{ color: "#4a6a8a", fontSize: 16 }}>🔍</span>
// //                 <input
// //                   value={search}
// //                   onChange={e => setSearch(e.target.value)}
// //                   placeholder="Search teams..."
// //                   style={{
// //                     background: "none", border: "none", color: "#fff", fontSize: 16,
// //                     fontFamily: "'Barlow Condensed', sans-serif", outline: "none", width: 160
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
// //         {REGIONS.map(region => {
// //           const regionTeams = filtered.filter(t => t.region === region);
// //           if (!regionTeams.length) return null;
// //           return (
// //             <div key={region} style={{ marginBottom: 40 }}>
// //               <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
// //                 <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>
// //                   {region} Region
// //                 </div>
// //                 <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
// //               </div>

// //               <div style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
// //                 gap: 10
// //               }}>
// //                 {regionTeams
// //                   .sort((a, b) => a.seed - b.seed)
// //                   .map(team => {
// //                     const p = TEAM_PROBS[team.id] || { r64: 0, s16: 0, champ: 0 };
// //                     return (
// //                       <button
// //                         key={team.id}
// //                         onClick={() => onSelectTeam(team)}
// //                         style={{
// //                           background: "#0d1526", border: "1px solid #1a2d4a",
// //                           borderRadius: 10, padding: "14px 16px",
// //                           cursor: "pointer", textAlign: "left",
// //                           color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
// //                           transition: "all 0.2s ease",
// //                           position: "relative", overflow: "hidden",
// //                         }}
// //                         onMouseEnter={e => {
// //                           e.currentTarget.style.borderColor = team.color || "#1d6ecc";
// //                           e.currentTarget.style.background = "#111d35";
// //                           e.currentTarget.style.transform = "translateY(-2px)";
// //                         }}
// //                         onMouseLeave={e => {
// //                           e.currentTarget.style.borderColor = "#1a2d4a";
// //                           e.currentTarget.style.background = "#0d1526";
// //                           e.currentTarget.style.transform = "translateY(0)";
// //                         }}
// //                       >
// //                         <div style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#4a6a8a", fontWeight: 700 }}>
// //                           #{team.seed}
// //                         </div>
// //                         <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
// //                           <TeamBadge team={team} size={32} />
// //                           <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{team.name}</div>
// //                         </div>
// //                         <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
// //                           {[["r64", "R64"], ["s16", "S16"], ["champ", "🏆"]].map(([key, lbl]) => (
// //                             <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
// //                               <div style={{ fontSize: 10, color: "#4a6a8a", width: 24 }}>{lbl}</div>
// //                               <div style={{ flex: 1, height: 4, background: "#1a2d4a", borderRadius: 2 }}>
// //                                 <div style={{
// //                                   height: "100%", borderRadius: 2,
// //                                   width: PCT(p[key]),
// //                                   background: key === "champ" ? `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)` : "#1d6ecc"
// //                                 }} />
// //                               </div>
// //                               <div style={{ fontSize: 11, color: "#5aabff", width: 32, textAlign: "right", fontWeight: 700 }}>
// //                                 {PCT(p[key])}
// //                               </div>
// //                             </div>
// //                           ))}
// //                         </div>
// //                       </button>
// //                     );
// //                   })}
// //               </div>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // };


// export default function App() {
//   const [page, setPage] = useState("main");
//   const [selectedTeam, setSelectedTeam] = useState(null);

//   if (typeof document !== "undefined") {
//     const existing = document.getElementById("march-madness-fonts");
//     if (!existing) {
//       const link = document.createElement("link");
//       link.id = "march-madness-fonts";
//       link.rel = "stylesheet";
//       link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&display=swap";
//       document.head.appendChild(link);
//     }
//   }

//   if (page === "team" && selectedTeam) return <TeamDetail team={selectedTeam} onBack={() => setPage("main")} />;
//   if (page === "bracket") return <BracketPage onBack={() => setPage("main")} />;
//   return <MainPage onSelectTeam={team => { setSelectedTeam(team); setPage("team"); }} onBracket={() => setPage("bracket")} />;
// }

// // const BracketPage = ({ onBack }) => {
// //   // Uses target round probability to mathematically advance teams
// //   const getWinner = (t1Id, t2Id, targetRoundKey) => {
// //     if (!t1Id) return t2Id;
// //     if (!t2Id) return t1Id;
// //     const p1 = TEAM_PROBS[t1Id]?.[targetRoundKey] || 0;
// //     const p2 = TEAM_PROBS[t2Id]?.[targetRoundKey] || 0;
// //     return p1 > p2 ? t1Id : t2Id;
// //   };

// //   // 1. Process all 4 regions dynamically
// //   const regionsData = REGIONS.map(region => {
// //     const regionTeams = TEAMS.filter(t => t.region === region);
// //     const TOPOLOGY = [[1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]];
    
// //     const r64Matchups = TOPOLOGY.map(([s1, s2]) => ({
// //       t1: regionTeams.find(t => t.seed === s1)?.id,
// //       t2: regionTeams.find(t => t.seed === s2)?.id
// //     }));

// //     const r32Matchups = [];
// //     for(let i=0; i<8; i+=2) r32Matchups.push({ t1: getWinner(r64Matchups[i].t1, r64Matchups[i].t2, "r32"), t2: getWinner(r64Matchups[i+1].t1, r64Matchups[i+1].t2, "r32") });

// //     const s16Matchups = [];
// //     for(let i=0; i<4; i+=2) s16Matchups.push({ t1: getWinner(r32Matchups[i].t1, r32Matchups[i].t2, "s16"), t2: getWinner(r32Matchups[i+1].t1, r32Matchups[i+1].t2, "s16") });

// //     const e8Matchups = [{ t1: getWinner(s16Matchups[0].t1, s16Matchups[0].t2, "e8"), t2: getWinner(s16Matchups[1].t1, s16Matchups[1].t2, "e8") }];

// //     // The team that wins the Elite 8 goes to the Final Four
// //     const regionWinner = getWinner(e8Matchups[0].t1, e8Matchups[0].t2, "f4");

// //     return {
// //       region,
// //       regionWinner,
// //       columns: [
// //         { round: "r64", data: r64Matchups },
// //         { round: "r32", data: r32Matchups },
// //         { round: "s16", data: s16Matchups },
// //         { round: "e8", data: e8Matchups }
// //       ]
// //     };
// //   });

// //   // 2. Final Four & Championship Processing
// //   const f4_game1 = { t1: regionsData[0].regionWinner, t2: regionsData[1].regionWinner }; // East vs West
// //   const f4_game2 = { t1: regionsData[2].regionWinner, t2: regionsData[3].regionWinner }; // South vs Midwest
  
// //   const f2_t1 = getWinner(f4_game1.t1, f4_game1.t2, "f2");
// //   const f2_t2 = getWinner(f4_game2.t1, f4_game2.t2, "f2");
// //   const champ_matchup = { t1: f2_t1, t2: f2_t2 };
  
// //   const championId = getWinner(champ_matchup.t1, champ_matchup.t2, "champ");
// //   const championTeam = TEAMS.find(t => t.id === championId);

// //   // 3. Reusable Bracket Block Component
// //   const RegionBlock = ({ data, reverse }) => (
// //     <div style={{ background: "rgba(13, 21, 38, 0.4)", padding: 16, borderRadius: 12, border: "1px solid #1a2d4a" }}>
// //       <div style={{
// //         fontSize: 14, color: "#5aabff", letterSpacing: 4, fontWeight: 800,
// //         textTransform: "uppercase", marginBottom: 16, textAlign: reverse ? "right" : "left"
// //       }}>
// //         {data.region} REGION
// //       </div>
// //       <div style={{ display: "flex", flexDirection: reverse ? "row-reverse" : "row", gap: 12 }}>
// //         {data.columns.map((col, colIndex) => (
// //           <div key={colIndex} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
// //             {col.data.map((m, i) => (
// //               <MatchupRow key={i} matchup={m} roundKey={col.round} reverse={reverse} />
// //             ))}
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
// //         <div style={{ background: "#090e1a", marginTop: 2, padding: "20px 32px" }}>
// //           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //             <button onClick={onBack} style={{
// //               background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
// //               padding: "6px 18px", borderRadius: 4, cursor: "pointer",
// //               fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
// //               textTransform: "uppercase"
// //             }}>← Back</button>

// //             <div style={{ textAlign: "center", flex: 1 }}>
// //               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>NCAA</div>
// //               <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>STANDARD BRACKET VIEW</div>
// //             </div>
            
// //             <div style={{ width: 80 }}></div> 
// //           </div>
// //         </div>
// //       </div>

// //       {/* HORIZONTAL SCROLL CONTAINER */}
// //       <div style={{ overflowX: "auto", padding: "32px", WebkitOverflowScrolling: "touch" }}>
        
// //         {/* MASSIVE BRACKET FLEXBOX - FIXED OVERFLOW CLIPPING */}
// //         <div style={{ display: "flex", gap: 24, width: "max-content", margin: "0 auto", padding: "0 20px" }}>
          
// //           {/* LEFT SIDE (East & West) */}
// //           <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
// //             <RegionBlock data={regionsData[0]} reverse={false} />
// //             <RegionBlock data={regionsData[1]} reverse={false} />
// //           </div>

// //           {/* CENTER COLUMN (Final Four & Championship) */}
// //           <div style={{ width: 220, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, flexShrink: 0 }}>
            
// //             <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#5aabff", letterSpacing: 2 }}>FINAL FOUR</div>
// //             <MatchupRow matchup={f4_game1} roundKey="f4" reverse={false} />
// //             <MatchupRow matchup={f4_game2} roundKey="f4" reverse={true} />

// //             <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#facc15", letterSpacing: 2, marginTop: 16 }}>CHAMPIONSHIP</div>
// //             <MatchupRow matchup={champ_matchup} roundKey="f2" reverse={false} />

// //             {championTeam && (
// //               <div style={{ textAlign: "center", marginTop: 24, background: "rgba(74, 222, 128, 0.1)", padding: "20px 10px", borderRadius: 12, border: "1px solid #4ade80" }}>
// //                 <div style={{ fontSize: 12, color: "#4ade80", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>NATIONAL CHAMPION</div>
// //                 <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
// //                   <TeamBadge team={championTeam} size={64} />
// //                 </div>
// //                 <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{championTeam.name}</div>
// //               </div>
// //             )}
// //           </div>

// //           {/* RIGHT SIDE (South & Midwest) - Uses `reverse={true}` to build toward the center! */}
// //           <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
// //             <RegionBlock data={regionsData[2]} reverse={true} />
// //             <RegionBlock data={regionsData[3]} reverse={true} />
// //           </div>

// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // const BracketPage = ({ onBack }) => {
// //   // Uses target round probability to mathematically advance teams
// //   const getWinner = (t1Id, t2Id, targetRoundKey) => {
// //     if (!t1Id) return t2Id;
// //     if (!t2Id) return t1Id;
// //     const p1 = TEAM_PROBS[t1Id]?.[targetRoundKey] || 0;
// //     const p2 = TEAM_PROBS[t2Id]?.[targetRoundKey] || 0;
// //     return p1 > p2 ? t1Id : t2Id;
// //   };

// //   // 1. Process all 4 regions dynamically
// //   const regionsData = REGIONS.map(region => {
// //     const regionTeams = TEAMS.filter(t => t.region === region);
// //     const TOPOLOGY = [[1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]];
    
// //     const r64Matchups = TOPOLOGY.map(([s1, s2]) => ({
// //       t1: regionTeams.find(t => t.seed === s1)?.id,
// //       t2: regionTeams.find(t => t.seed === s2)?.id
// //     }));

// //     const r32Matchups = [];
// //     for(let i=0; i<8; i+=2) r32Matchups.push({ t1: getWinner(r64Matchups[i].t1, r64Matchups[i].t2, "r32"), t2: getWinner(r64Matchups[i+1].t1, r64Matchups[i+1].t2, "r32") });

// //     const s16Matchups = [];
// //     for(let i=0; i<4; i+=2) s16Matchups.push({ t1: getWinner(r32Matchups[i].t1, r32Matchups[i].t2, "s16"), t2: getWinner(r32Matchups[i+1].t1, r32Matchups[i+1].t2, "s16") });

// //     const e8Matchups = [{ t1: getWinner(s16Matchups[0].t1, s16Matchups[0].t2, "e8"), t2: getWinner(s16Matchups[1].t1, s16Matchups[1].t2, "e8") }];

// //     // The team that wins the Elite 8 goes to the Final Four
// //     const regionWinner = getWinner(e8Matchups[0].t1, e8Matchups[0].t2, "f4");

// //     return {
// //       region,
// //       regionWinner,
// //       columns: [
// //         { round: "r64", data: r64Matchups },
// //         { round: "r32", data: r32Matchups },
// //         { round: "s16", data: s16Matchups },
// //         { round: "e8", data: e8Matchups }
// //       ]
// //     };
// //   });

// //   // 2. Final Four & Championship Processing
// //   const f4_game1 = { t1: regionsData[0].regionWinner, t2: regionsData[1].regionWinner }; // East vs West
// //   const f4_game2 = { t1: regionsData[2].regionWinner, t2: regionsData[3].regionWinner }; // South vs Midwest
  
// //   const f2_t1 = getWinner(f4_game1.t1, f4_game1.t2, "f2");
// //   const f2_t2 = getWinner(f4_game2.t1, f4_game2.t2, "f2");
// //   const champ_matchup = { t1: f2_t1, t2: f2_t2 };
  
// //   const championId = getWinner(champ_matchup.t1, champ_matchup.t2, "champ");
// //   const championTeam = TEAMS.find(t => t.id === championId);

// //   // 3. Reusable Bracket Block Component
// //   const RegionBlock = ({ data, reverse }) => (
// //     <div style={{ background: "rgba(13, 21, 38, 0.4)", padding: 16, borderRadius: 12, border: "1px solid #1a2d4a" }}>
// //       <div style={{
// //         fontSize: 14, color: "#5aabff", letterSpacing: 4, fontWeight: 800,
// //         textTransform: "uppercase", marginBottom: 16, textAlign: reverse ? "right" : "left"
// //       }}>
// //         {data.region} REGION
// //       </div>
// //       <div style={{ display: "flex", flexDirection: reverse ? "row-reverse" : "row", gap: 12 }}>
// //         {data.columns.map((col, colIndex) => (
// //           <div key={colIndex} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
// //             {col.data.map((m, i) => (
// //               <MatchupRow key={i} matchup={m} roundKey={col.round} reverse={reverse} />
// //             ))}
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
// //         <div style={{ background: "#090e1a", marginTop: 2, padding: "20px 32px" }}>
// //           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //             <button onClick={onBack} style={{
// //               background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
// //               padding: "6px 18px", borderRadius: 4, cursor: "pointer",
// //               fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
// //               textTransform: "uppercase"
// //             }}>← Back</button>

// //             <div style={{ textAlign: "center", flex: 1 }}>
// //               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>NCAA</div>
// //               <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>STANDARD BRACKET VIEW</div>
// //             </div>
            
// //             <div style={{ width: 80 }}></div> 
// //           </div>
// //         </div>
// //       </div>

// //       HORIZONTAL SCROLL CONTAINER
// //       <div style={{ overflowX: "auto", padding: "32px", WebkitOverflowScrolling: "touch" }}>
        
// //         {/* MASSIVE BRACKET FLEXBOX */}
// //         <div style={{ display: "flex", justifyContent: "center", gap: 24, minWidth: 1600, margin: "0 auto" }}>
          
// //           {/* LEFT SIDE (East & West) */}
// //           <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
// //             <RegionBlock data={regionsData[0]} reverse={false} />
// //             <RegionBlock data={regionsData[1]} reverse={false} />
// //           </div>

// //           {/* CENTER COLUMN (Final Four & Championship) */}
// //           <div style={{ width: 220, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, flexShrink: 0 }}>
            
// //             <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#5aabff", letterSpacing: 2 }}>FINAL FOUR</div>
// //             <MatchupRow matchup={f4_game1} roundKey="f4" reverse={false} />
// //             <MatchupRow matchup={f4_game2} roundKey="f4" reverse={true} />

// //             <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#facc15", letterSpacing: 2, marginTop: 16 }}>CHAMPIONSHIP</div>
// //             <MatchupRow matchup={champ_matchup} roundKey="f2" reverse={false} />

// //             {championTeam && (
// //               <div style={{ textAlign: "center", marginTop: 24, background: "rgba(74, 222, 128, 0.1)", padding: "20px 10px", borderRadius: 12, border: "1px solid #4ade80" }}>
// //                 <div style={{ fontSize: 12, color: "#4ade80", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>NATIONAL CHAMPION</div>
// //                 <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
// //                   <TeamBadge team={championTeam} size={64} />
// //                 </div>
// //                 <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{championTeam.name}</div>
// //               </div>
// //             )}
// //           </div>

// //           {/* RIGHT SIDE (South & Midwest) - Uses `reverse={true}` to build toward the center! */}
// //           <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
// //             <RegionBlock data={regionsData[2]} reverse={true} />
// //             <RegionBlock data={regionsData[3]} reverse={true} />
// //           </div>

// //         </div>
// //       </div>
// //     </div>
// //   );
// // };


// // OLD BRACKET THAT DOES NOT SHOW FINAL FOUR
// // import { useState } from "react";

// // // ─── DYNAMIC DATA LAYER ────────────────────────────────────────────────────────
// // // Pulling live data straight from your Python XGBoost pipeline!
// // import TEAMS from "./react_teams.json";
// // import TEAM_PROBS from "./react_team_probs.json";

// // const REGIONS = ["East", "West", "South", "Midwest"];

// // const ROUND_LABELS = {
// //   r64: "Round of 64",
// //   r32: "Round of 32",
// //   s16: "Sweet 16",
// //   e8: "Elite Eight",
// //   f4: "Final Four",
// //   f2: "Championship",
// //   champ: "Champion",
// // };

// // const PCT = (v) => `${Math.round(v * 100)}%`;

// // // ─── COMPONENTS ────────────────────────────────────────────────────────────────

// // const TeamBadge = ({ team, size = 36 }) => (
// //   <div style={{
// //     width: size, height: size, borderRadius: "50%",
// //     background: team.color || "#1d6ecc",
// //     display: "flex", alignItems: "center", justifyContent: "center",
// //     fontSize: size * 0.32, fontWeight: 900, color: "#fff",
// //     fontFamily: "'Barlow Condensed', sans-serif",
// //     letterSpacing: -0.5, flexShrink: 0,
// //     boxShadow: `0 0 0 2px rgba(255,255,255,0.15)`,
// //   }}>
// //     {team.name.slice(0, 2).toUpperCase()}
// //   </div>
// // );

// // // ─── TEAM DETAIL PAGE ─────────────────────────────────────────────────────────
// // const TeamDetail = ({ team, onBack }) => {
// //   const probs = TEAM_PROBS[team.id] || { r64: 0, r32: 0, s16: 0, e8: 0, f4: 0, f2: 0, champ: 0 };
// //   const rounds = Object.entries(ROUND_LABELS);

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       {/* Header */}
// //       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
// //         <div style={{ background: "#090e1a", marginTop: 2, padding: "28px 32px 24px" }}>
// //           <button onClick={onBack} style={{
// //             background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
// //             padding: "6px 18px", borderRadius: 4, cursor: "pointer",
// //             fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
// //             marginBottom: 20, textTransform: "uppercase"
// //           }}>← Back</button>
// //           <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
// //             <TeamBadge team={team} size={64} />
// //             <div>
// //               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase" }}>
// //                 #{team.seed} seed · {team.region} Region
// //               </div>
// //               <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>{team.name}</div>
// //               <div style={{ fontSize: 16, color: "#8ab4d8", marginTop: 4 }}>
// //                 Monte Carlo Championship Probability: <span style={{ color: "#5aabff", fontWeight: 700 }}>{PCT(probs.champ)}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Round-by-round */}
// //       <div style={{ padding: "32px 32px 64px" }}>
// //         <div style={{ fontSize: 13, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
// //           Round-by-Round Win Probabilities
// //         </div>

// //         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
// //           {rounds.map(([key, label], i) => {
// //             const p = probs[key] || 0;
// //             return (
// //               <div key={key} style={{
// //                 background: "#0d1526", border: "1px solid #1a2d4a",
// //                 borderRadius: 10, overflow: "hidden",
// //                 opacity: p < 0.05 ? 0.5 : 1,
// //               }}>
// //                 <div style={{
// //                   display: "flex", alignItems: "center", justifyContent: "space-between",
// //                   padding: "16px 20px", background: "rgba(29,110,204,0.06)"
// //                 }}>
// //                   <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
// //                     <div style={{
// //                       width: 28, height: 28, borderRadius: 4,
// //                       background: "#1d6ecc", display: "flex", alignItems: "center",
// //                       justifyContent: "center", fontSize: 12, fontWeight: 700
// //                     }}>{i + 1}</div>
// //                     <div>
// //                       <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>{label}</div>
// //                     </div>
// //                   </div>
// //                   <div style={{ textAlign: "right" }}>
// //                     <div style={{ fontSize: 36, fontWeight: 900, color: p >= 0.6 ? "#4ade80" : p >= 0.35 ? "#facc15" : "#f87171", lineHeight: 1 }}>
// //                       {PCT(p)}
// //                     </div>
// //                     <div style={{ fontSize: 11, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: 1 }}>advance prob</div>
// //                   </div>
// //                 </div>
// //                 <div style={{ height: 4, background: "#1a2d4a" }}>
// //                   <div style={{
// //                     height: "100%", width: PCT(p),
// //                     background: p >= 0.6 ? "linear-gradient(90deg,#22c55e,#4ade80)" :
// //                       p >= 0.35 ? "linear-gradient(90deg,#d97706,#facc15)" :
// //                         "linear-gradient(90deg,#dc2626,#f87171)",
// //                     transition: "width 1s ease"
// //                   }} />
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─── UPDATED BRACKET PAGE COMPONENTS ──────────────────────────────────────────

// // const MatchupRow = ({ matchup, roundKey }) => {
// //   const t1 = TEAMS.find(t => t.id === matchup.t1);
// //   const t2 = TEAMS.find(t => t.id === matchup.t2);
  
// //   if (!t1 && !t2) return <div style={{ height: 64, marginBottom: 8 }} />;

// //   const p1 = t1 && TEAM_PROBS[t1.id] ? TEAM_PROBS[t1.id][roundKey] : 0;
// //   const p2 = t2 && TEAM_PROBS[t2.id] ? TEAM_PROBS[t2.id][roundKey] : 0;

// //   const totalProb = p1 + p2;
// //   const displayP1 = totalProb > 0 ? p1 / totalProb : 0.5;
// //   const displayP2 = totalProb > 0 ? p2 / totalProb : 0.5;

// //   const getHighlight = (prob) => prob >= 0.5 ? "rgba(74,222,128,0.12)" : "transparent";
// //   const getTextColor = (prob) => prob >= 0.5 ? "#4ade80" : "#fff";

// //   const TeamRow = ({ team, prob }) => {
// //     if (!team) return <div style={{ height: 32, padding: "9px 12px" }} />;
// //     return (
// //       <div style={{
// //         display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
// //         background: getHighlight(prob),
// //         borderRadius: 6, transition: "background 0.3s"
// //       }}>
// //         <span style={{ fontSize: 10, color: "#4a6a8a", width: 14, textAlign: "right" }}>{team.seed}</span>
// //         <TeamBadge team={team} size={18} />
// //         <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: getTextColor(prob), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
// //           {team.name}
// //         </span>
// //         <div style={{ textAlign: "right" }}>
// //           <div style={{ fontSize: 13, fontWeight: 800, color: prob >= 0.6 ? "#4ade80" : prob >= 0.4 ? "#facc15" : "#f87171" }}>
// //             {PCT(prob)}
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   return (
// //     <div style={{
// //       background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 8,
// //       overflow: "hidden", marginBottom: 8, minWidth: 180, width: "100%"
// //     }}>
// //       <TeamRow team={t1} prob={displayP1} />
// //       <div style={{ height: 1, background: "#1a2d4a" }} />
// //       <TeamRow team={t2} prob={displayP2} />
// //     </div>
// //   );
// // };

// // const BracketPage = ({ onBack }) => {
// //   const getWinner = (t1Id, t2Id, roundKey) => {
// //     if (!t1Id) return t2Id;
// //     if (!t2Id) return t1Id;
// //     const p1 = TEAM_PROBS[t1Id]?.[roundKey] || 0;
// //     const p2 = TEAM_PROBS[t2Id]?.[roundKey] || 0;
// //     return p1 > p2 ? t1Id : t2Id;
// //   };

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
// //         <div style={{ background: "#090e1a", marginTop: 2, padding: "24px 32px" }}>
// //           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //             <button onClick={onBack} style={{
// //               background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
// //               padding: "6px 18px", borderRadius: 4, cursor: "pointer",
// //               fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
// //               textTransform: "uppercase"
// //             }}>← Back</button>

// //             <div style={{ textAlign: "center", flex: 1 }}>
// //               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>NCAA</div>
// //               <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>FULL BRACKET VIEW</div>
// //             </div>
            
// //             <div style={{ width: 80 }}></div> 
// //           </div>
// //         </div>
// //       </div>

// //       <div style={{ padding: "24px 32px 64px" }}>
// //         <div style={{
// //           display: "grid", gridTemplateColumns: "1fr 1fr",
// //           gap: 40
// //         }}>
// //           {REGIONS.map(region => {
// //             const regionTeams = TEAMS.filter(t => t.region === region);
            
// //             const TOPOLOGY = [[1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]];
            
// //             const r64Matchups = TOPOLOGY.map(([seed1, seed2]) => {
// //               const team1 = regionTeams.find(t => t.seed === seed1);
// //               const team2 = regionTeams.find(t => t.seed === seed2);
// //               return { t1: team1?.id, t2: team2?.id };
// //             });

// //             const r32Matchups = [];
// //             for(let i = 0; i < 8; i+=2) {
// //               r32Matchups.push({
// //                 t1: getWinner(r64Matchups[i].t1, r64Matchups[i].t2, "r64"),
// //                 t2: getWinner(r64Matchups[i+1].t1, r64Matchups[i+1].t2, "r64")
// //               });
// //             }

// //             const s16Matchups = [];
// //             for(let i = 0; i < 4; i+=2) {
// //               s16Matchups.push({
// //                 t1: getWinner(r32Matchups[i].t1, r32Matchups[i].t2, "r32"),
// //                 t2: getWinner(r32Matchups[i+1].t1, r32Matchups[i+1].t2, "r32")
// //               });
// //             }

// //             const e8Matchups = [{
// //               t1: getWinner(s16Matchups[0].t1, s16Matchups[0].t2, "s16"),
// //               t2: getWinner(s16Matchups[1].t1, s16Matchups[1].t2, "s16")
// //             }];

// //             const columns = [
// //               { round: "r64", data: r64Matchups },
// //               { round: "r32", data: r32Matchups },
// //               { round: "s16", data: s16Matchups },
// //               { round: "e8", data: e8Matchups }
// //             ];

// //             return (
// //               <div key={region} style={{ background: "rgba(13, 21, 38, 0.4)", padding: 20, borderRadius: 12, border: "1px solid #1a2d4a" }}>
// //                 <div style={{
// //                   fontSize: 16, color: "#5aabff", letterSpacing: 4, fontWeight: 800,
// //                   textTransform: "uppercase", marginBottom: 20, textAlign: "center"
// //                 }}>
// //                   {region} REGION
// //                 </div>
                
// //                 <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
// //                   {columns.map((col, colIndex) => (
// //                     <div key={colIndex} style={{ 
// //                       flex: 1, display: "flex", flexDirection: "column", 
// //                       justifyContent: "space-around"
// //                     }}>
// //                       {col.data.map((m, i) => (
// //                         <MatchupRow key={i} matchup={m} roundKey={col.round} />
// //                       ))}
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>

// //         {/* Championship probability bar */}
// //         <div style={{ marginTop: 40, borderTop: "1px solid #1a2d4a", paddingTop: 32 }}>
// //           <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
// //             Championship Probability — Top 8
// //           </div>
// //           <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640, margin: "0 auto" }}>
// //             {[...TEAMS]
// //               .sort((a, b) => (TEAM_PROBS[b.id]?.champ || 0) - (TEAM_PROBS[a.id]?.champ || 0))
// //               .slice(0, 8)
// //               .map((team, i) => {
// //                 const p = TEAM_PROBS[team.id]?.champ || 0;
// //                 return (
// //                   <div key={team.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
// //                     <span style={{ fontSize: 13, color: "#4a6a8a", width: 18, textAlign: "right" }}>#{i + 1}</span>
// //                     <TeamBadge team={team} size={28} />
// //                     <span style={{ width: 130, fontSize: 15, fontWeight: 600 }}>{team.name}</span>
// //                     <div style={{ flex: 1, height: 8, background: "#1a2d4a", borderRadius: 4 }}>
// //                       <div style={{
// //                         height: "100%", borderRadius: 4,
// //                         width: `${Math.round(p * 100 * 5)}%`,
// //                         background: `linear-gradient(90deg, #1d6ecc, #5aabff)`,
// //                         maxWidth: "100%"
// //                       }} />
// //                     </div>
// //                     <span style={{ width: 44, textAlign: "right", fontSize: 16, fontWeight: 800, color: "#5aabff" }}>{PCT(p)}</span>
// //                   </div>
// //                 );
// //               })}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// // const MainPage = ({ onSelectTeam, onBracket }) => {
// //   const [search, setSearch] = useState("");

// //   const filtered = TEAMS.filter(t =>
// //     t.name.toLowerCase().includes(search.toLowerCase()) ||
// //     t.region.toLowerCase().includes(search.toLowerCase())
// //   );

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{
// //         background: "linear-gradient(135deg, #1d6ecc 0%, #0d3d73 60%, #090e1a 100%)",
// //         padding: "0 0 3px"
// //       }}>
// //         <div style={{ background: "#090e1a", marginTop: 3 }}>
// //           <div style={{
// //             maxWidth: 1200, margin: "0 auto", padding: "40px 32px 32px",
// //             display: "flex", flexDirection: "column", alignItems: "center",
// //             textAlign: "center"
// //           }}>
// //             <div style={{ fontSize: 11, letterSpacing: 5, color: "#5aabff", textTransform: "uppercase", marginBottom: 8 }}>
// //               NCAA Tournament
// //             </div>
// //             <div style={{
// //               fontSize: 72, fontWeight: 900, lineHeight: 0.88,
// //               letterSpacing: -2, textTransform: "uppercase",
// //               background: "linear-gradient(180deg, #fff 40%, #5aabff 100%)",
// //               WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
// //             }}>
// //               MARCH<br />MADNESS
// //             </div>
// //             <div style={{
// //               fontSize: 16, color: "#4a6a8a", marginTop: 10, letterSpacing: 2,
// //               textTransform: "uppercase"
// //             }}>
// //               XGBoost Prediction Model
// //             </div>

// //             <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
// //               <button onClick={onBracket} style={{
// //                 background: "linear-gradient(135deg, #1d6ecc, #0a5aad)",
// //                 border: "none", color: "#fff", padding: "12px 32px",
// //                 borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 700,
// //                 letterSpacing: 1.5, textTransform: "uppercase",
// //                 fontFamily: "'Barlow Condensed', sans-serif",
// //                 boxShadow: "0 4px 20px rgba(29,110,204,0.4)",
// //               }}>
// //                 View Full Bracket →
// //               </button>
// //               <div style={{
// //                 display: "flex", alignItems: "center",
// //                 background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
// //                 padding: "0 16px", gap: 8
// //               }}>
// //                 <span style={{ color: "#4a6a8a", fontSize: 16 }}>🔍</span>
// //                 <input
// //                   value={search}
// //                   onChange={e => setSearch(e.target.value)}
// //                   placeholder="Search teams..."
// //                   style={{
// //                     background: "none", border: "none", color: "#fff", fontSize: 16,
// //                     fontFamily: "'Barlow Condensed', sans-serif", outline: "none", width: 160
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
// //         {REGIONS.map(region => {
// //           const regionTeams = filtered.filter(t => t.region === region);
// //           if (!regionTeams.length) return null;
// //           return (
// //             <div key={region} style={{ marginBottom: 40 }}>
// //               <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
// //                 <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>
// //                   {region} Region
// //                 </div>
// //                 <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
// //               </div>

// //               <div style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
// //                 gap: 10
// //               }}>
// //                 {regionTeams
// //                   .sort((a, b) => a.seed - b.seed)
// //                   .map(team => {
// //                     const p = TEAM_PROBS[team.id] || { r64: 0, s16: 0, champ: 0 };
// //                     return (
// //                       <button
// //                         key={team.id}
// //                         onClick={() => onSelectTeam(team)}
// //                         style={{
// //                           background: "#0d1526", border: "1px solid #1a2d4a",
// //                           borderRadius: 10, padding: "14px 16px",
// //                           cursor: "pointer", textAlign: "left",
// //                           color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
// //                           transition: "all 0.2s ease",
// //                           position: "relative", overflow: "hidden",
// //                         }}
// //                         onMouseEnter={e => {
// //                           e.currentTarget.style.borderColor = team.color || "#1d6ecc";
// //                           e.currentTarget.style.background = "#111d35";
// //                           e.currentTarget.style.transform = "translateY(-2px)";
// //                         }}
// //                         onMouseLeave={e => {
// //                           e.currentTarget.style.borderColor = "#1a2d4a";
// //                           e.currentTarget.style.background = "#0d1526";
// //                           e.currentTarget.style.transform = "translateY(0)";
// //                         }}
// //                       >
// //                         <div style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#4a6a8a", fontWeight: 700 }}>
// //                           #{team.seed}
// //                         </div>
// //                         <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
// //                           <TeamBadge team={team} size={32} />
// //                           <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{team.name}</div>
// //                         </div>
// //                         <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
// //                           {[["r64", "R64"], ["s16", "S16"], ["champ", "🏆"]].map(([key, lbl]) => (
// //                             <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
// //                               <div style={{ fontSize: 10, color: "#4a6a8a", width: 24 }}>{lbl}</div>
// //                               <div style={{ flex: 1, height: 4, background: "#1a2d4a", borderRadius: 2 }}>
// //                                 <div style={{
// //                                   height: "100%", borderRadius: 2,
// //                                   width: PCT(p[key]),
// //                                   background: key === "champ" ? `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)` : "#1d6ecc"
// //                                 }} />
// //                               </div>
// //                               <div style={{ fontSize: 11, color: "#5aabff", width: 32, textAlign: "right", fontWeight: 700 }}>
// //                                 {PCT(p[key])}
// //                               </div>
// //                             </div>
// //                           ))}
// //                         </div>
// //                       </button>
// //                     );
// //                   })}
// //               </div>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // };

// // export default function App() {
// //   const [page, setPage] = useState("main");
// //   const [selectedTeam, setSelectedTeam] = useState(null);

// //   if (typeof document !== "undefined") {
// //     const existing = document.getElementById("march-madness-fonts");
// //     if (!existing) {
// //       const link = document.createElement("link");
// //       link.id = "march-madness-fonts";
// //       link.rel = "stylesheet";
// //       link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&display=swap";
// //       document.head.appendChild(link);
// //     }
// //   }

// //   if (page === "team" && selectedTeam) return <TeamDetail team={selectedTeam} onBack={() => setPage("main")} />;
// //   if (page === "bracket") return <BracketPage onBack={() => setPage("main")} />;
// //   return <MainPage onSelectTeam={team => { setSelectedTeam(team); setPage("team"); }} onBracket={() => setPage("bracket")} />;
// // }







// // OLD FLAT BRACKET THAT ONLY SHOWS FIRST ROUND
// // import { useState } from "react";

// // // ─── DYNAMIC DATA LAYER ────────────────────────────────────────────────────────
// // // Pulling live data straight from your Python XGBoost pipeline!
// // import TEAMS from "./react_teams.json";
// // import TEAM_PROBS from "./react_team_probs.json";

// // const REGIONS = ["East", "West", "South", "Midwest"];

// // const ROUND_LABELS = {
// //   r64: "Round of 64",
// //   r32: "Round of 32",
// //   s16: "Sweet 16",
// //   e8: "Elite Eight",
// //   f4: "Final Four",
// //   f2: "Championship",
// //   champ: "Champion",
// // };

// // const PCT = (v) => `${Math.round(v * 100)}%`;

// // // ─── COMPONENTS ────────────────────────────────────────────────────────────────

// // const TeamBadge = ({ team, size = 36 }) => (
// //   <div style={{
// //     width: size, height: size, borderRadius: "50%",
// //     background: team.color || "#1d6ecc",
// //     display: "flex", alignItems: "center", justifyContent: "center",
// //     fontSize: size * 0.32, fontWeight: 900, color: "#fff",
// //     fontFamily: "'Barlow Condensed', sans-serif",
// //     letterSpacing: -0.5, flexShrink: 0,
// //     boxShadow: `0 0 0 2px rgba(255,255,255,0.15)`,
// //   }}>
// //     {team.name.slice(0, 2).toUpperCase()}
// //   </div>
// // );

// // // ─── TEAM DETAIL PAGE ─────────────────────────────────────────────────────────
// // const TeamDetail = ({ team, onBack }) => {
// //   const probs = TEAM_PROBS[team.id] || { r64: 0, r32: 0, s16: 0, e8: 0, f4: 0, f2: 0, champ: 0 };
// //   const rounds = Object.entries(ROUND_LABELS);

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       {/* Header */}
// //       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
// //         <div style={{ background: "#090e1a", marginTop: 2, padding: "28px 32px 24px" }}>
// //           <button onClick={onBack} style={{
// //             background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
// //             padding: "6px 18px", borderRadius: 4, cursor: "pointer",
// //             fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
// //             marginBottom: 20, textTransform: "uppercase"
// //           }}>← Back</button>
// //           <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
// //             <TeamBadge team={team} size={64} />
// //             <div>
// //               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase" }}>
// //                 #{team.seed} seed · {team.region} Region
// //               </div>
// //               <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>{team.name}</div>
// //               <div style={{ fontSize: 16, color: "#8ab4d8", marginTop: 4 }}>
// //                 Monte Carlo Championship Probability: <span style={{ color: "#5aabff", fontWeight: 700 }}>{PCT(probs.champ)}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Round-by-round */}
// //       <div style={{ padding: "32px 32px 64px" }}>
// //         <div style={{ fontSize: 13, color: "#5aabff", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
// //           Round-by-Round Win Probabilities
// //         </div>

// //         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
// //           {rounds.map(([key, label], i) => {
// //             const p = probs[key] || 0;
// //             return (
// //               <div key={key} style={{
// //                 background: "#0d1526", border: "1px solid #1a2d4a",
// //                 borderRadius: 10, overflow: "hidden",
// //                 opacity: p < 0.05 ? 0.5 : 1,
// //               }}>
// //                 <div style={{
// //                   display: "flex", alignItems: "center", justifyContent: "space-between",
// //                   padding: "16px 20px", background: "rgba(29,110,204,0.06)"
// //                 }}>
// //                   <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
// //                     <div style={{
// //                       width: 28, height: 28, borderRadius: 4,
// //                       background: "#1d6ecc", display: "flex", alignItems: "center",
// //                       justifyContent: "center", fontSize: 12, fontWeight: 700
// //                     }}>{i + 1}</div>
// //                     <div>
// //                       <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>{label}</div>
// //                     </div>
// //                   </div>
// //                   <div style={{ textAlign: "right" }}>
// //                     <div style={{ fontSize: 36, fontWeight: 900, color: p >= 0.6 ? "#4ade80" : p >= 0.35 ? "#facc15" : "#f87171", lineHeight: 1 }}>
// //                       {PCT(p)}
// //                     </div>
// //                     <div style={{ fontSize: 11, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: 1 }}>advance prob</div>
// //                   </div>
// //                 </div>
// //                 <div style={{ height: 4, background: "#1a2d4a" }}>
// //                   <div style={{
// //                     height: "100%", width: PCT(p),
// //                     background: p >= 0.6 ? "linear-gradient(90deg,#22c55e,#4ade80)" :
// //                       p >= 0.35 ? "linear-gradient(90deg,#d97706,#facc15)" :
// //                         "linear-gradient(90deg,#dc2626,#f87171)",
// //                     transition: "width 1s ease"
// //                   }} />
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─── BRACKET PAGE ─────────────────────────────────────────────────────────────
// // const MatchupRow = ({ matchup }) => {
// //   const t1 = TEAMS.find(t => t.id === matchup.t1);
// //   const t2 = TEAMS.find(t => t.id === matchup.t2);
// //   if (!t1 || !t2) return null;

// //   const p1 = TEAM_PROBS[t1.id]?.r64 ?? 0.5;
// //   const p2 = TEAM_PROBS[t2.id]?.r64 ?? (1 - p1);

// //   const getHighlight = (prob) => {
// //     return prob >= 0.5 ? "rgba(74,222,128,0.12)" : "transparent";
// //   };

// //   const getTextColor = (prob) => {
// //     return prob >= 0.5 ? "#4ade80" : "#fff";
// //   };

// //   const TeamRow = ({ team, prob }) => (
// //     <div style={{
// //       display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
// //       background: getHighlight(prob),
// //       borderRadius: 6, transition: "background 0.3s"
// //     }}>
// //       <span style={{ fontSize: 11, color: "#4a6a8a", width: 18, textAlign: "right" }}>{team.seed}</span>
// //       <TeamBadge team={team} size={22} />
// //       <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: getTextColor(prob) }}>{team.name}</span>
// //       <div style={{ textAlign: "right" }}>
// //         <div style={{ fontSize: 14, fontWeight: 800, color: prob >= 0.6 ? "#4ade80" : prob >= 0.4 ? "#facc15" : "#f87171" }}>
// //           {PCT(prob)}
// //         </div>
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div style={{
// //       background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 8,
// //       overflow: "hidden", marginBottom: 8
// //     }}>
// //       <TeamRow team={t1} prob={p1} />
// //       <div style={{ height: 1, background: "#1a2d4a" }} />
// //       <TeamRow team={t2} prob={p2} />
// //     </div>
// //   );
// // };

// // const BracketPage = ({ onBack }) => {
// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{ background: "linear-gradient(135deg, #1d6ecc 0%, #0a3d6e 100%)", padding: "0 0 2px" }}>
// //         <div style={{ background: "#090e1a", marginTop: 2, padding: "24px 32px" }}>
// //           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //             <button onClick={onBack} style={{
// //               background: "none", border: "1px solid #1d6ecc", color: "#5aabff",
// //               padding: "6px 18px", borderRadius: 4, cursor: "pointer",
// //               fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1,
// //               textTransform: "uppercase"
// //             }}>← Back</button>

// //             <div style={{ textAlign: "center", flex: 1 }}>
// //               <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>NCAA</div>
// //               <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>BRACKET VIEW</div>
// //             </div>
            
// //             <div style={{ width: 80 }}></div> {/* Spacer to center the title */}
// //           </div>
// //         </div>
// //       </div>

// //       <div style={{ padding: "24px 32px 64px" }}>
// //         <div style={{
// //           display: "grid", gridTemplateColumns: "1fr 1fr",
// //           gap: 32
// //         }}>
// //           {REGIONS.map(region => {
// //             const regionTeams = TEAMS.filter(t => t.region === region);
            
// //             // ─── THE TOPOLOGY MAP ───────────────────────────────────────
// //             // This forces React to draw the bracket in the exact NCAA order
// //             const TOPOLOGY = [
// //               [1, 16], [8, 9], [5, 12], [4, 13], 
// //               [6, 11], [3, 14], [7, 10], [2, 15]
// //             ];
            
// //             const displayMatchups = TOPOLOGY.map(([seed1, seed2]) => {
// //               const team1 = regionTeams.find(t => t.seed === seed1);
// //               const team2 = regionTeams.find(t => t.seed === seed2);
              
// //               return {
// //                 r: "R64",
// //                 t1: team1 ? team1.id : null,
// //                 t2: team2 ? team2.id : null,
// //               };
// //             }).filter(m => m.t1 && m.t2); // Only draw if both teams exist

// //             return (
// //               <div key={region}>
// //                 <div style={{
// //                   fontSize: 11, color: "#5aabff", letterSpacing: 4,
// //                   textTransform: "uppercase", marginBottom: 14,
// //                   display: "flex", alignItems: "center", gap: 10
// //                 }}>
// //                   <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
// //                   <span>{region} Region</span>
// //                   <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
// //                 </div>
// //                 {displayMatchups.map((m, i) => (
// //                   <MatchupRow key={i} matchup={m} />
// //                 ))}
// //               </div>
// //             );
// //           })}
// //         </div>

// //         {/* Championship probability bar */}
// //         <div style={{ marginTop: 40, borderTop: "1px solid #1a2d4a", paddingTop: 32 }}>
// //           <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
// //             Championship Probability — Top 8
// //           </div>
// //           <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640, margin: "0 auto" }}>
// //             {[...TEAMS]
// //               .sort((a, b) => (TEAM_PROBS[b.id]?.champ || 0) - (TEAM_PROBS[a.id]?.champ || 0))
// //               .slice(0, 8)
// //               .map((team, i) => {
// //                 const p = TEAM_PROBS[team.id]?.champ || 0;
// //                 return (
// //                   <div key={team.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
// //                     <span style={{ fontSize: 13, color: "#4a6a8a", width: 18, textAlign: "right" }}>#{i + 1}</span>
// //                     <TeamBadge team={team} size={28} />
// //                     <span style={{ width: 130, fontSize: 15, fontWeight: 600 }}>{team.name}</span>
// //                     <div style={{ flex: 1, height: 8, background: "#1a2d4a", borderRadius: 4 }}>
// //                       <div style={{
// //                         height: "100%", borderRadius: 4,
// //                         width: `${Math.round(p * 100 * 5)}%`,
// //                         background: `linear-gradient(90deg, #1d6ecc, #5aabff)`,
// //                         maxWidth: "100%"
// //                       }} />
// //                     </div>
// //                     <span style={{ width: 44, textAlign: "right", fontSize: 16, fontWeight: 800, color: "#5aabff" }}>{PCT(p)}</span>
// //                   </div>
// //                 );
// //               })}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// // const MainPage = ({ onSelectTeam, onBracket }) => {
// //   const [search, setSearch] = useState("");

// //   const filtered = TEAMS.filter(t =>
// //     t.name.toLowerCase().includes(search.toLowerCase()) ||
// //     t.region.toLowerCase().includes(search.toLowerCase())
// //   );

// //   return (
// //     <div style={{ minHeight: "100vh", background: "#090e1a", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
// //       <div style={{
// //         background: "linear-gradient(135deg, #1d6ecc 0%, #0d3d73 60%, #090e1a 100%)",
// //         padding: "0 0 3px"
// //       }}>
// //         <div style={{ background: "#090e1a", marginTop: 3 }}>
// //           <div style={{
// //             maxWidth: 1200, margin: "0 auto", padding: "40px 32px 32px",
// //             display: "flex", flexDirection: "column", alignItems: "center",
// //             textAlign: "center"
// //           }}>
// //             <div style={{ fontSize: 11, letterSpacing: 5, color: "#5aabff", textTransform: "uppercase", marginBottom: 8 }}>
// //               NCAA Tournament
// //             </div>
// //             <div style={{
// //               fontSize: 72, fontWeight: 900, lineHeight: 0.88,
// //               letterSpacing: -2, textTransform: "uppercase",
// //               background: "linear-gradient(180deg, #fff 40%, #5aabff 100%)",
// //               WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
// //             }}>
// //               MARCH<br />MADNESS
// //             </div>
// //             <div style={{
// //               fontSize: 16, color: "#4a6a8a", marginTop: 10, letterSpacing: 2,
// //               textTransform: "uppercase"
// //             }}>
// //               XGBoost Prediction Model
// //             </div>

// //             <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
// //               <button onClick={onBracket} style={{
// //                 background: "linear-gradient(135deg, #1d6ecc, #0a5aad)",
// //                 border: "none", color: "#fff", padding: "12px 32px",
// //                 borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 700,
// //                 letterSpacing: 1.5, textTransform: "uppercase",
// //                 fontFamily: "'Barlow Condensed', sans-serif",
// //                 boxShadow: "0 4px 20px rgba(29,110,204,0.4)",
// //               }}>
// //                 View Full Bracket →
// //               </button>
// //               <div style={{
// //                 display: "flex", alignItems: "center",
// //                 background: "#0d1526", border: "1px solid #1a2d4a", borderRadius: 6,
// //                 padding: "0 16px", gap: 8
// //               }}>
// //                 <span style={{ color: "#4a6a8a", fontSize: 16 }}>🔍</span>
// //                 <input
// //                   value={search}
// //                   onChange={e => setSearch(e.target.value)}
// //                   placeholder="Search teams..."
// //                   style={{
// //                     background: "none", border: "none", color: "#fff", fontSize: 16,
// //                     fontFamily: "'Barlow Condensed', sans-serif", outline: "none", width: 160
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 64px" }}>
// //         {REGIONS.map(region => {
// //           const regionTeams = filtered.filter(t => t.region === region);
// //           if (!regionTeams.length) return null;
// //           return (
// //             <div key={region} style={{ marginBottom: 40 }}>
// //               <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
// //                 <div style={{ fontSize: 11, color: "#5aabff", letterSpacing: 4, textTransform: "uppercase" }}>
// //                   {region} Region
// //                 </div>
// //                 <div style={{ flex: 1, height: 1, background: "#1a2d4a" }} />
// //               </div>

// //               <div style={{
// //                 display: "grid",
// //                 gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
// //                 gap: 10
// //               }}>
// //                 {regionTeams
// //                   .sort((a, b) => a.seed - b.seed)
// //                   .map(team => {
// //                     const p = TEAM_PROBS[team.id] || { r64: 0, s16: 0, champ: 0 };
// //                     return (
// //                       <button
// //                         key={team.id}
// //                         onClick={() => onSelectTeam(team)}
// //                         style={{
// //                           background: "#0d1526", border: "1px solid #1a2d4a",
// //                           borderRadius: 10, padding: "14px 16px",
// //                           cursor: "pointer", textAlign: "left",
// //                           color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
// //                           transition: "all 0.2s ease",
// //                           position: "relative", overflow: "hidden",
// //                         }}
// //                         onMouseEnter={e => {
// //                           e.currentTarget.style.borderColor = team.color || "#1d6ecc";
// //                           e.currentTarget.style.background = "#111d35";
// //                           e.currentTarget.style.transform = "translateY(-2px)";
// //                         }}
// //                         onMouseLeave={e => {
// //                           e.currentTarget.style.borderColor = "#1a2d4a";
// //                           e.currentTarget.style.background = "#0d1526";
// //                           e.currentTarget.style.transform = "translateY(0)";
// //                         }}
// //                       >
// //                         <div style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "#4a6a8a", fontWeight: 700 }}>
// //                           #{team.seed}
// //                         </div>
// //                         <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
// //                           <TeamBadge team={team} size={32} />
// //                           <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{team.name}</div>
// //                         </div>
// //                         <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
// //                           {[["r64", "R64"], ["s16", "S16"], ["champ", "🏆"]].map(([key, lbl]) => (
// //                             <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
// //                               <div style={{ fontSize: 10, color: "#4a6a8a", width: 24 }}>{lbl}</div>
// //                               <div style={{ flex: 1, height: 4, background: "#1a2d4a", borderRadius: 2 }}>
// //                                 <div style={{
// //                                   height: "100%", borderRadius: 2,
// //                                   width: PCT(p[key]),
// //                                   background: key === "champ" ? `linear-gradient(90deg, ${team.color || "#1d6ecc"}, #5aabff)` : "#1d6ecc"
// //                                 }} />
// //                               </div>
// //                               <div style={{ fontSize: 11, color: "#5aabff", width: 32, textAlign: "right", fontWeight: 700 }}>
// //                                 {PCT(p[key])}
// //                               </div>
// //                             </div>
// //                           ))}
// //                         </div>
// //                       </button>
// //                     );
// //                   })}
// //               </div>
// //             </div>
// //           );
// //         })}
// //       </div>
// //     </div>
// //   );
// // };

// // export default function App() {
// //   const [page, setPage] = useState("main");
// //   const [selectedTeam, setSelectedTeam] = useState(null);

// //   if (typeof document !== "undefined") {
// //     const existing = document.getElementById("march-madness-fonts");
// //     if (!existing) {
// //       const link = document.createElement("link");
// //       link.id = "march-madness-fonts";
// //       link.rel = "stylesheet";
// //       link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&display=swap";
// //       document.head.appendChild(link);
// //     }
// //   }

// //   if (page === "team" && selectedTeam) return <TeamDetail team={selectedTeam} onBack={() => setPage("main")} />;
// //   if (page === "bracket") return <BracketPage onBack={() => setPage("main")} />;
// //   return <MainPage onSelectTeam={team => { setSelectedTeam(team); setPage("team"); }} onBracket={() => setPage("bracket")} />;
// // }