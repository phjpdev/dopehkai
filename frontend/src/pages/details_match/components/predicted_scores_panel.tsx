import { Probability } from "../../../models/probability";
import { alignPredictedPairsWithHad, computeDefaultPredictedScores } from "./predicted_scores_compute";

export interface PredictedScoresPanelProps {
    probability: Probability;
    /** When false, show the chrome only with VVVIP upsell copy (scores hidden). */
    showFullPrediction?: boolean;
}

function resolvedPairs(probability: Probability): { row1: { home: number; away: number }; row2: { home: number; away: number } } {
    const d = probability.adminAnalysisEdits?.predictedScoreDisplay;
    const base = computeDefaultPredictedScores(probability);
    const clamp = (n: unknown): number | undefined => {
        const x = Number(n);
        if (!Number.isFinite(x)) return undefined;
        return Math.round(Math.max(0, Math.min(20, x)));
    };
    const h1 = clamp(d?.row1Home);
    const a1 = clamp(d?.row1Away);
    const h2 = clamp(d?.row2Home);
    const a2 = clamp(d?.row2Away);
    return alignPredictedPairsWithHad(
        {
            row1:
                h1 !== undefined && a1 !== undefined ? { home: h1, away: a1 } : base.row1,
            row2:
                h2 !== undefined && a2 !== undefined ? { home: h2, away: a2 } : base.row2,
        },
        probability
    );
}

/**
 * 預測比分 — baseline from last-games + IA tilt; optional admin overrides (Home : Away).
 */
export default function PredictedScoresPanel({ probability, showFullPrediction = true }: PredictedScoresPanelProps) {
    const ia = probability.ia;
    if (showFullPrediction && !ia) return null;

    let homePct = 50;
    let awayPct = 50;
    if (ia) {
        homePct = typeof ia.home === "number" ? ia.home : 0;
        awayPct = typeof ia.away === "number" ? ia.away : 0;
        if (homePct <= 0 && awayPct <= 0) {
            homePct = 50;
            awayPct = 50;
        }
        const total = homePct + awayPct;
        if (total > 0 && Math.abs(total - 100) > 0.5) {
            homePct = (homePct / total) * 100;
            awayPct = (awayPct / total) * 100;
        }
    }

    const pairs = showFullPrediction && ia ? resolvedPairs(probability) : null;
    const scoreLine1 =
        pairs && showFullPrediction ? `${pairs.row1.home} : ${pairs.row1.away}` : "";
    const scoreLine2 =
        pairs && showFullPrediction ? `${pairs.row2.home} : ${pairs.row2.away}` : "";

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

                {!showFullPrediction ? (
                    <p
                        className="py-8 text-center text-base sm:text-lg font-semibold tracking-wide"
                        style={{ color: "rgba(212, 175, 55, 0.92)" }}
                    >
                        VVVIP 會員專享
                    </p>
                ) : (
                    <>
                        <ScoreRow score={scoreLine1} pct={awayRowPct} />
                        <div className="h-3" />
                        <ScoreRow score={scoreLine2} pct={homeRowPct} />
                    </>
                )}
            </div>
        </div>
    );
}

function ScoreRow({ score, pct }: { score: string; pct: number }) {
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
