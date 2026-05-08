/**
 * Persist team names / logos / form onto `analysis` docs so when HKJC sync deletes
 * finished fixtures from `matches`, list + detail APIs can still hydrate cards from `analysis` alone.
 */
import { doc, setDoc } from "../database/db";
import { db } from "../firebase/firebase";
import { Match } from "../model/match.model";
import Tables from "../ultis/tables.ultis";
import { kickOffStringToMs } from "./analysisRetention";

function okName(s: unknown): s is string {
    return typeof s === "string" && !!s.trim() && s.trim() !== "—";
}

/** Fields safe to merge onto `Tables.analysis[id]` alongside IA payloads. */
export function displaySnapshotFromMatch(matchId: string, m: Partial<Match>): Record<string, unknown> {
    const kickOff =
        typeof m.kickOff === "string" && m.kickOff.trim()
            ? m.kickOff.trim()
            : undefined;
    const patch: Record<string, unknown> = { matchId };
    if (kickOff) {
        patch.analysisKickOff = kickOff;
        const ms = kickOffStringToMs(kickOff);
        if (ms != null) patch.analysisKickOffMs = ms;
    }
    if (okName(m.homeTeamName)) patch.homeTeamName = m.homeTeamName!.trim();
    if (okName(m.awayTeamName)) patch.awayTeamName = m.awayTeamName!.trim();
    if (okName(m.homeTeamNameEn)) patch.homeTeamNameEn = m.homeTeamNameEn!.trim();
    if (okName(m.awayTeamNameEn)) patch.awayTeamNameEn = m.awayTeamNameEn!.trim();
    if (typeof m.homeTeamLogo === "string" && m.homeTeamLogo.trim()) patch.homeTeamLogo = m.homeTeamLogo.trim();
    if (typeof m.awayTeamLogo === "string" && m.awayTeamLogo.trim()) patch.awayTeamLogo = m.awayTeamLogo.trim();
    const hf =
        typeof m.homeForm === "string" && m.homeForm.trim() ? m.homeForm.trim() : undefined;
    const af =
        typeof m.awayForm === "string" && m.awayForm.trim() ? m.awayForm.trim() : undefined;
    if (hf != null) patch.homeForm = hf;
    if (af != null) patch.awayForm = af;
    if (typeof m.competitionName === "string" && m.competitionName.trim()) {
        patch.competitionName = m.competitionName.trim();
    }
    if (typeof m.leagueCode === "string" && m.leagueCode.trim()) patch.leagueCode = m.leagueCode.trim();
    if (typeof m.competitionId === "number" && m.competitionId > 0) patch.competitionId = m.competitionId;
    if (m.homeLanguages && typeof m.homeLanguages === "object") patch.homeLanguages = m.homeLanguages;
    if (m.awayLanguages && typeof m.awayLanguages === "object") patch.awayLanguages = m.awayLanguages;
    return patch;
}

export async function mergeMatchDisplayIntoAnalysisDoc(matchId: string, m: Partial<Match>): Promise<void> {
    const payload = displaySnapshotFromMatch(matchId, m);
    if (Object.keys(payload).length <= 1) return;
    await setDoc(doc(db, Tables.analysis, matchId), payload as any, { merge: true });
}
