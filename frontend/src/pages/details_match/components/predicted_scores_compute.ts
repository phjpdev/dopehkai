import type { Probability } from "../../../models/probability";

export interface PredictedScorePair {
    home: number;
    away: number;
}

/**
 * 預測比分 baselines (Home : Away integers 0–5).
 *
 * Row1 is always paired with 客勝概率 (away-win row) in the UI, Row2 with 主勝概率
 * (home-win row), so each row must show a score consistent with its own label –
 * row1: away > home, row2: home > away. The magnitude/margin is shaped from
 * last-games scoring rates plus an IA tilt; the strict winner enforcement makes
 * the two displayed scorelines match their own probability labels even when the
 * raw "average goals" baseline would have favoured the other side.
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

    return {
        row1: makeAwayWinScore(baseHome, baseAway, awayMargin),
        row2: makeHomeWinScore(baseHome, baseAway, homeMargin),
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
