import type { Match, LastGames, TeamLanguages } from "../models/match";
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
    homeLanguages?: TeamLanguages;
    awayLanguages?: TeamLanguages;
    homeTeamId?: number;
    awayTeamId?: number;
    homeForm?: string;
    awayForm?: string;
    competitionName?: string;
    outcomeName?: string;
    matchOutcome?: string;
    leagueCode?: string;
    leagueNameProfileId?: string;
    lastGames?: LastGames;
    ia?: ResultIA;
}

/** Shape rows from `GET /api/match/past-results` into list `Match` for 比賽 cards. */
export function pastResultRowToMatch(row: PastResultListRow): Match {
    const fallbackLogo = AppAssets.logo_black;
    const homeLogo = row.homeTeamLogo?.trim() || fallbackLogo;
    const awayLogo = row.awayTeamLogo?.trim() || fallbackLogo;
    /**
     * Server may already supply `homeLanguages.zh` (HKJC enrichment). Use it before falling back to
     * the flat name fields so cards on the list show the same Chinese label as live fixtures.
     */
    const langZhHome = row.homeLanguages?.zh?.trim();
    const langZhAway = row.awayLanguages?.zh?.trim();
    const homeLabel = (langZhHome && langZhHome !== "—")
        ? langZhHome
        : displayTeamLabel(row.homeTeamName, row.homeTeamNameEn);
    const awayLabel = (langZhAway && langZhAway !== "—")
        ? langZhAway
        : displayTeamLabel(row.awayTeamName, row.awayTeamNameEn);
    const hf = (row.homeForm && row.homeForm.trim()) || "";
    const af = (row.awayForm && row.awayForm.trim()) || "";
    const lastGames = row.lastGames ?? emptyLastGames();
    if (hf && !lastGames.homeTeam.teamForm) lastGames.homeTeam.teamForm = hf;
    if (af && !lastGames.awayTeam.teamForm) lastGames.awayTeam.teamForm = af;
    const homeLanguages: TeamLanguages = row.homeLanguages
        ? { ...row.homeLanguages, zh: row.homeLanguages.zh || homeLabel }
        : { zh: homeLabel, en: row.homeTeamNameEn || homeLabel };
    const awayLanguages: TeamLanguages = row.awayLanguages
        ? { ...row.awayLanguages, zh: row.awayLanguages.zh || awayLabel }
        : { zh: awayLabel, en: row.awayTeamNameEn || awayLabel };
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
        homeTeamId: row.homeTeamId ?? 0,
        awayTeamId: row.awayTeamId ?? 0,
        homeLanguages,
        awayLanguages,
        lastGames,
        leagueCode: row.leagueCode,
        leagueNameProfileId: row.leagueNameProfileId,
        ia: row.ia,
    };
}
