import { HKJC } from "../model/hkjc.model";
import { Match } from "../model/match.model";
import { hkjcTeamLogoFromTeamId } from "./hkjcTeamLogo";

/**
 * Merge HKJC GraphQL row (fixtures + results list) into our Match shape for list/detail display.
 */
export function enrichMatchFromHkjcGraphql(m: Match, hk: HKJC): Match {
    const out: Match = { ...m };
    const ht = hk.homeTeam;
    const at = hk.awayTeam;
    if (ht?.name_ch) out.homeTeamName = ht.name_ch;
    else if (ht?.name_en) out.homeTeamName = ht.name_en;
    if (at?.name_ch) out.awayTeamName = at.name_ch;
    else if (at?.name_en) out.awayTeamName = at.name_en;
    if (ht?.name_en != null) out.homeTeamNameEn = ht.name_en;
    if (at?.name_en != null) out.awayTeamNameEn = at.name_en;
    out.homeLanguages = {
        zh: ht?.name_ch || out.homeLanguages?.zh || "",
        en: ht?.name_en || out.homeLanguages?.en || "",
        zhCN: ht?.name_ch || out.homeLanguages?.zhCN || "",
    };
    out.awayLanguages = {
        zh: at?.name_ch || out.awayLanguages?.zh || "",
        en: at?.name_en || out.awayLanguages?.en || "",
        zhCN: at?.name_ch || out.awayLanguages?.zhCN || "",
    };
    const hLogo = hkjcTeamLogoFromTeamId(ht?.id);
    const aLogo = hkjcTeamLogoFromTeamId(at?.id);
    if (hLogo) out.homeTeamLogo = hLogo;
    if (aLogo) out.awayTeamLogo = aLogo;
    if (hk.tournament?.name_ch) out.competitionName = hk.tournament.name_ch;
    else if (hk.tournament?.name_en) out.competitionName = hk.tournament.name_en;
    if (hk.tournament?.code) out.leagueCode = hk.tournament.code;
    if (hk.tournament?.nameProfileId) out.leagueNameProfileId = hk.tournament.nameProfileId;
    if (hk.tournament?.id != null && hk.tournament.id !== "") {
        const n = parseInt(String(hk.tournament.id), 10);
        if (Number.isFinite(n) && n > 0) out.competitionId = n;
    }
    if (hk.runningResult && hk.runningResult.homeScore != null && hk.runningResult.awayScore != null) {
        out.matchOutcome = `${hk.runningResult.homeScore}-${hk.runningResult.awayScore}`;
    }
    return out;
}
