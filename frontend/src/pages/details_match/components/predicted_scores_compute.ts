import type { Probability } from "../../../models/probability";

export interface PredictedScorePair {
    home: number;
    away: number;
}

/**
 * 預測比分 baseline: Home : Away integers (0–4) from last-games rates + IA tilt (same logic as legacy panel).
 */
export function computeDefaultPredictedScores(probability: Probability): {
    row1: PredictedScorePair;
    row2: PredictedScorePair;
} {
    const ia = probability.ia;
    if (!ia) {
        return { row1: { home: 1, away: 1 }, row2: { home: 1, away: 1 } };
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

    const away1 = goalsPerGameToDisplayGoals(expAwayAtHome, 1);
    const home1 = goalsPerGameToDisplayGoals(expHomeAtAway, 1);

    let away2 = away1;
    let home2 = home1;
    const tiltHome = homePct > awayPct + 2;
    const tiltAway = awayPct > homePct + 2;
    if (tiltHome) {
        home2 = Math.min(4, home1 + 1);
        if (away2 === away1 && home2 === home1) away2 = Math.max(0, away1 - 1);
    } else if (tiltAway) {
        away2 = Math.min(4, away1 + 1);
        if (away2 === away1 && home2 === home1) home2 = Math.max(0, home1 - 1);
    } else {
        home2 = Math.min(4, home1 + 1);
        away2 = Math.min(4, away1 + 1);
        if (away2 === away1 && home2 === home1) {
            home2 = Math.min(4, home1 + 1);
            away2 = Math.max(0, away1 - 1);
        }
    }

    return {
        row1: { home: home1, away: away1 },
        row2: { home: home2, away: away2 },
    };
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
