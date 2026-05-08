import type { Match, LastGames } from "../models/match";
import type { ResultIA } from "../models/probability";
import AppAssets from "./assets";

function emptyLastGames(): LastGames {
    const emptyNext = {
        kickOff: "",
        homeTeamName: "",
        awayTeamName: "",
        competitionName: "",
    };
    return {
        homeTeam: {
            recentMatch: [],
            nextMatch: emptyNext,
            teamPlayed: "0",
            teamForm: "",
            teamGoalsFor: "0",
            teamGoalsAway: "0",
            teamWin: "0",
            teamDraw: "0",
            teamLoss: "0",
        },
        awayTeam: {
            recentMatch: [],
            nextMatch: {
                awayTeamName: "",
                kickOff: "",
                competitionName: "",
                homeTeamName: "",
            },
            teamPlayed: "0",
            teamForm: "",
            teamGoalsFor: "0",
            teamGoalsAway: "0",
            teamWin: "0",
            teamDraw: "0",
            teamLoss: "0",
        },
    };
}

/** Prefer Chinese-style list name, then English (analysis stubs often only have one). */
function displayTeamLabel(zh?: string, en?: string): string {
    for (const c of [zh, en]) {
        const t = (c ?? "").trim();
        if (t && t !== "—") return t;
    }
    return "—";
}

export interface PastResultListRow {
    id: string;
    kickOff: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamNameEn?: string;
    awayTeamNameEn?: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    homeForm?: string;
    awayForm?: string;
    competitionName?: string;
    outcomeName?: string;
    matchOutcome?: string;
    ia?: ResultIA;
}

/** Shape rows from `GET /api/match/past-results` into list `Match` for 比賽 cards. */
export function pastResultRowToMatch(row: PastResultListRow): Match {
    const fallbackLogo = AppAssets.logo_black;
    const homeLogo = row.homeTeamLogo?.trim() || fallbackLogo;
    const awayLogo = row.awayTeamLogo?.trim() || fallbackLogo;
    const homeLabel = displayTeamLabel(row.homeTeamName, row.homeTeamNameEn);
    const awayLabel = displayTeamLabel(row.awayTeamName, row.awayTeamNameEn);
    const hf = (row.homeForm && row.homeForm.trim()) || "";
    const af = (row.awayForm && row.awayForm.trim()) || "";
    const lastGames = emptyLastGames();
    if (hf) lastGames.homeTeam.teamForm = hf;
    if (af) lastGames.awayTeam.teamForm = af;
    return {
        id: row.id,
        eventId: row.id,
        matchDateFormated: "",
        homeTeamName: homeLabel,
        awayTeamName: awayLabel,
        kickOff: row.kickOff,
        kickOffTime: "",
        kickOffDate: "",
        kickOffDateLocal: "",
        homeTeamNameEn: row.homeTeamNameEn || row.homeTeamName || "",
        awayTeamNameEn: row.awayTeamNameEn || row.awayTeamName || "",
        homeTeamLogo: homeLogo,
        awayTeamLogo: awayLogo,
        competitionName: row.competitionName || "",
        competitionId: 0,
        competitionIdNav: 0,
        outcomeName: row.outcomeName || "",
        matchOutcome: row.matchOutcome || "",
        homeForm: hf,
        awayForm: af,
        countryId: "",
        countryName: "",
        hadDrawPct: "",
        hadHomePct: "",
        hadAwayPct: "",
        bestBetName: "",
        awayTeamImgUrl: null,
        homeTeamId: 0,
        awayTeamId: 0,
        homeLanguages: { zh: homeLabel, en: row.homeTeamNameEn || homeLabel },
        awayLanguages: { zh: awayLabel, en: row.awayTeamNameEn || awayLabel },
        lastGames,
        ia: row.ia,
    };
}
