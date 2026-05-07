import { ApiFixtureByDate } from "../data/api-fixture";
import { Match } from "../model/match.model";
import { matchTeamSimilarity } from "./similarity";

/** Supports HKJC `MM/DD/YYYY`, ISO `YYYY-MM-DD` (+ optional time), and `YYYY/MM/DD`. Returns `YYYY-MM-DD` or null. */
function kickOffDateToApiYmd(kickOffDate: string): string | null {
    const s = kickOffDate.trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso) {
        return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
    const parts = s.split("/");
    if (parts.length !== 3) {
        return null;
    }
    const [p0, p1, p2] = parts;
    if (p0.length === 4) {
        return `${p0}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
    }
    const month = p0.padStart(2, "0");
    const day = p1.padStart(2, "0");
    const year = p2;
    return `${year}-${month}-${day}`;
}

export async function GetFixture(
    match: Match): Promise<any> {
    try {
        if (!match.kickOffDate) {
            return null;
        }

        const formattedDate = kickOffDateToApiYmd(match.kickOffDate);
        if (!formattedDate) {
            return null;
        }
        let team = await ApiFixtureByDate(formattedDate);
        
        // Validate team is an array
        if (!team || !Array.isArray(team) || team.length === 0) {
            return null;
        }
        
        const homeTeamName = match.homeTeamNameEn || match.homeTeamName;
        const awayTeamName = match.awayTeamNameEn || match.awayTeamName;
        if (homeTeamName && awayTeamName) {
            const fixture = await matchTeamSimilarity(team, homeTeamName, awayTeamName);
            return fixture;
        }
        return null;
    } catch (error) {
        console.error("[GetFixture] Error:", error);
        return null;
    }
}
