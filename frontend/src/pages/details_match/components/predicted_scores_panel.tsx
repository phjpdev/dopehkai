import { Probability } from "../../../models/probability";

/**
 * "Goals per game" from last-games stats is often 1–6+; map it to a typical
 * full-time goal count for display (0–4) so we do not clamp everything to 5.
 */
function goalsPerGameToDisplayGoals(raw: number, fallback: number): number {
    const g = Number.isFinite(raw) && raw > 0 ? raw : fallback;
    const damped = Math.min(g, 5.5) * 0.52 + 0.35;
    return Math.max(0, Math.min(4, Math.round(damped)));
}

function parseGoalsPerGame(team: { teamGoalsFor?: string } | undefined, fallback: number): number {
    if (!team?.teamGoalsFor) return fallback;
    const v = parseFloat(String(team.teamGoalsFor).replace(/[^\d.]/g, ""));
    return Number.isFinite(v) && v > 0 ? v : fallback;
}

function parseGoalsConceded(team: { teamGoalsAway?: string } | undefined, fallback: number): number {
    if (!team?.teamGoalsAway) return fallback;
    const v = parseFloat(String(team.teamGoalsAway).replace(/[^\d.]/g, ""));
    return Number.isFinite(v) && v > 0 ? v : fallback;
}

export interface PredictedScoresPanelProps {
    probability: Probability;
}

/**
 * 預測比分 — scores from last-games attack/concede rates (damped to 0–4);
 * bar percentages from IA 1X2 (home / away). Two lines differ using model tilt.
 */
export default function PredictedScoresPanel({ probability }: PredictedScoresPanelProps) {
    const ia = probability.ia;
    if (!ia) return null;

    let homePct = typeof ia.home === "number" ? ia.home : 0;
    let awayPct = typeof ia.away === "number" ? ia.away : 0;
    if (homePct <= 0 && awayPct <= 0) {
        homePct = 50;
        awayPct = 50;
    }
    const total = homePct + awayPct;
    if (total > 0 && Math.abs(total - 100) > 0.5) {
        homePct = (homePct / total) * 100;
        awayPct = (awayPct / total) * 100;
    }

    const ht = probability.lastGames?.homeTeam;
    const at = probability.lastGames?.awayTeam;

    const homeAttack = parseGoalsPerGame(ht, 1.35);
    const homeConcede = parseGoalsConceded(ht, 1.2);
    const awayAttack = parseGoalsPerGame(at, 1.25);
    const awayConcede = parseGoalsConceded(at, 1.15);

    // Expected goals at each end: attack vs opponent defensive tendency
    const expAwayAtHome = (awayAttack + homeConcede) / 2;
    const expHomeAtAway = (homeAttack + awayConcede) / 2;

    let a1 = goalsPerGameToDisplayGoals(expAwayAtHome, 1);
    let h1 = goalsPerGameToDisplayGoals(expHomeAtAway, 1);

    // Second line: nudge toward IA favourite so it is not identical to the first
    let a2 = a1;
    let h2 = h1;
    const tiltHome = homePct > awayPct + 2;
    const tiltAway = awayPct > homePct + 2;
    if (tiltHome) {
        h2 = Math.min(4, h1 + 1);
        if (a2 === a1 && h2 === h1) a2 = Math.max(0, a1 - 1);
    } else if (tiltAway) {
        a2 = Math.min(4, a1 + 1);
        if (a2 === a1 && h2 === h1) h2 = Math.max(0, h1 - 1);
    } else {
        // Near 50/50: show a slightly higher-tempo second line
        h2 = Math.min(4, h1 + 1);
        a2 = Math.min(4, a1 + 1);
        if (a2 === a1 && h2 === h1) {
            h2 = Math.min(4, h1 + 1);
            a2 = Math.max(0, a1 - 1);
        }
    }

    const scoreLine1 = `${a1} : ${h1}`;
    const scoreLine2 = `${a2} : ${h2}`;

    const awayRowPct = Math.max(5, Math.min(95, Math.round(awayPct)));
    const homeRowPct = Math.max(5, Math.min(95, Math.round(homePct)));

    return (
        <div className="sm:w-2/3 w-5/6 mx-auto mt-1 mb-1">
            <div
                className="relative w-full rounded-xl overflow-hidden px-4 py-3 sm:px-6 sm:py-4"
                style={{
                    background: "linear-gradient(180deg, #1a1a1c 0%, #0f0f10 100%)",
                    border: "1px solid rgba(212, 175, 55, 0.85)",
                    boxShadow: "0 0 24px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
            >
                <div
                    className="pointer-events-none absolute inset-y-3 left-1 w-2 opacity-40"
                    style={{
                        background: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(212, 175, 55, 0.35) 3px,
              rgba(212, 175, 55, 0.35) 5px
            )`,
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-y-3 right-1 w-2 opacity-40"
                    style={{
                        background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              rgba(212, 175, 55, 0.35) 3px,
              rgba(212, 175, 55, 0.35) 5px
            )`,
                    }}
                />

                <p
                    className="text-center text-sm sm:text-base font-bold tracking-[0.2em] mb-3"
                    style={{ color: "rgba(212, 175, 55, 0.95)" }}
                >
                    預測比分
                </p>

                <ScoreRow score={scoreLine1} label="客勝概率" pct={awayRowPct} />
                <div className="h-3" />
                <ScoreRow score={scoreLine2} label="主勝概率" pct={homeRowPct} />
            </div>
        </div>
    );
}

function ScoreRow({ score, label, pct }: { score: string; label: string; pct: number }) {
    const parts = score.split(/\s*:\s*/);
    const left = parts[0]?.trim() ?? "";
    const right = parts[1]?.trim() ?? "";
    return (
        <div className="flex flex-row items-stretch justify-between gap-3 sm:gap-6">
            <div
                className="text-2xl sm:text-4xl font-extrabold tabular-nums flex-shrink-0 self-center whitespace-nowrap"
                style={{ color: "#e8c547" }}
            >
                <span>{left}</span>
                <span className="opacity-75 mx-1 sm:mx-2">:</span>
                <span>{right}</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">{label}</p>
                <p className="text-lg sm:text-2xl font-bold mb-1.5" style={{ color: "#e8c547" }}>
                    {pct}%
                </p>
                <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #b8860b, #f0dc82)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
