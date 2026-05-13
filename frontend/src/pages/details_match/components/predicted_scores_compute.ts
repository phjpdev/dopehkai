import type { Probability } from "../../../models/probability";

export interface PredictedScorePair {
    home: number;
    away: number;
}

export type HadOutcome = "HOME" | "AWAY" | "DRAW";

/** Same upper bound as manual score overrides in `predicted_scores_panel`. */
const PREDICTED_SCORE_CAP = 20;

/**
 * 1X2 direction from IA (explicit `picks.had.bestPick`, or implied when exactly one of home/away/draw % is strictly maximal).
 */
export function resolveHadOutcome(probability: Probability): HadOutcome | null {
    const ia = probability.ia;
    if (!ia) return null;
    const pick = ia.picks?.had?.bestPick;
    if (pick === "HOME" || pick === "AWAY" || pick === "DRAW") return pick;

    const h = typeof ia.home === "number" ? ia.home : 0;
    const a = typeof ia.away === "number" ? ia.away : 0;
    const d = typeof ia.draw === "number" ? ia.draw : 0;
    const max = Math.max(h, a, d);
    if (max <= 0) return null;
    const winners = [h === max, a === max, d === max].filter(Boolean).length;
    if (winners !== 1) return null;
    if (h === max) return "HOME";
    if (a === max) return "AWAY";
    return "DRAW";
}

/**
 * 預測比分 baselines (Home : Away integers 0–5).
 *
 * Both rows follow the same 主客和 outcome as `resolveHadOutcome`: HOME → both scorelines
 * are home wins, AWAY → both away wins, DRAW → both draws. Magnitude comes from last-games
 * rates plus IA tilt between home and away win shares.
 */
export function computeDefaultPredictedScores(probability: Probability): {
    row1: PredictedScorePair;
    row2: PredictedScorePair;
} {
    const ia = probability.ia;
    if (!ia) {
        return { row1: { home: 1, away: 2 }, row2: { home: 2, away: 1 } };
    }

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

    const expAwayAtHome = (awayAttack + homeConcede) / 2;
    const expHomeAtAway = (homeAttack + awayConcede) / 2;

    const baseHome = goalsPerGameToDisplayGoals(expHomeAtAway, 1);
    const baseAway = goalsPerGameToDisplayGoals(expAwayAtHome, 1);

    /** Heavier IA tilt (>30 pp gap) widens the favoured side's scoreline by an extra goal. */
    const gap = Math.abs(homePct - awayPct);
    const heavyTilt = gap >= 30;
    const homeFavoured = homePct >= awayPct;
    const homeMargin = heavyTilt && homeFavoured ? 2 : 1;
    const awayMargin = heavyTilt && !homeFavoured ? 2 : 1;

    const had = resolveHadOutcome(probability);
    if (had === "HOME") {
        return {
            row1: makeHomeWinScore(baseHome, baseAway, 1),
            row2: makeHomeWinScore(baseHome, baseAway, homeMargin),
        };
    }
    if (had === "AWAY") {
        return {
            row1: makeAwayWinScore(baseHome, baseAway, 1),
            row2: makeAwayWinScore(baseHome, baseAway, awayMargin),
        };
    }
    if (had === "DRAW") {
        return makeDrawScorePair(baseHome, baseAway);
    }

    return {
        row1: makeAwayWinScore(baseHome, baseAway, awayMargin),
        row2: makeHomeWinScore(baseHome, baseAway, homeMargin),
    };
}

/**
 * After admin overrides, coerce each row so it cannot contradict 主客和 (when an outcome exists).
 */
export function alignPredictedPairsWithHad(
    pairs: { row1: PredictedScorePair; row2: PredictedScorePair },
    probability: Probability
): { row1: PredictedScorePair; row2: PredictedScorePair } {
    const had = resolveHadOutcome(probability);
    if (!had) return pairs;
    return {
        row1: alignPairToHad(pairs.row1, had),
        row2: alignPairToHad(pairs.row2, had),
    };
}

function alignPairToHad(p: PredictedScorePair, had: HadOutcome): PredictedScorePair {
    if (had === "HOME") {
        if (p.home > p.away) return clampPair(p);
        return clampPair(makeHomeWinScore(p.home, p.away, 1));
    }
    if (had === "AWAY") {
        if (p.away > p.home) return clampPair(p);
        return clampPair(makeAwayWinScore(p.home, p.away, 1));
    }
    if (p.home === p.away) return clampPair(p);
    const v = Math.max(0, Math.min(PREDICTED_SCORE_CAP, Math.round((p.home + p.away) / 2)));
    return { home: v, away: v };
}

function clampPair(p: PredictedScorePair): PredictedScorePair {
    return {
        home: Math.max(0, Math.min(PREDICTED_SCORE_CAP, Math.round(p.home))),
        away: Math.max(0, Math.min(PREDICTED_SCORE_CAP, Math.round(p.away))),
    };
}

function makeDrawScorePair(baseHome: number, baseAway: number): {
    row1: PredictedScorePair;
    row2: PredictedScorePair;
} {
    const m = Math.max(0, Math.min(4, Math.round((baseHome + baseAway) / 2)));
    let m2 = m < 4 ? m + 1 : m - 1;
    if (m2 < 0) m2 = 0;
    if (m2 === m) m2 = Math.min(4, m + 1);
    return {
        row1: { home: m, away: m },
        row2: { home: m2, away: m2 },
    };
}

/**
 * Force the score to read as an away win (away > home). When the baseline
 * already has away losing or drawing we bump away up; we never inflate both
 * sides past the 0–4 baseline range that {@link goalsPerGameToDisplayGoals}
 * produces.
 */
function makeAwayWinScore(baseHome: number, baseAway: number, margin: number): PredictedScorePair {
    let home = baseHome;
    let away = baseAway;
    if (away - home < margin) {
        away = Math.min(5, home + margin);
    }
    return { home, away };
}

/** Mirror of {@link makeAwayWinScore} – ensures home strictly wins. */
function makeHomeWinScore(baseHome: number, baseAway: number, margin: number): PredictedScorePair {
    let home = baseHome;
    let away = baseAway;
    if (home - away < margin) {
        home = Math.min(5, away + margin);
    }
    return { home, away };
}

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
