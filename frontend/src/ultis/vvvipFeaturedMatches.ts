/** Calendar day as YYYY-MM-DD from API kickOff string. */
export function ymdFromKickOff(kickOff: string | undefined): string | undefined {
    if (!kickOff) return undefined;
    if (kickOff.includes("T")) return kickOff.split("T")[0];
    const part = kickOff.split(" ")[0];
    return part || undefined;
}

function hash32(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

/**
 * Deterministic "random" two matches for a calendar day (same seed + ids → same picks everywhere).
 * `sortedIds` must be sorted unique match ids for that day.
 */
export function pickVvvipFeaturedMatchIds(sortedIds: string[], seedYmd: string): string[] {
    const u = [...new Set(sortedIds)].filter(Boolean).sort((a, b) => a.localeCompare(b));
    if (u.length === 0) return [];
    if (u.length <= 2) return [...u];
    const scored = u.map((id) => ({ id, h: hash32(`${seedYmd}|${id}`) }));
    scored.sort((a, b) => (b.h !== a.h ? b.h - a.h : a.id.localeCompare(b.id)));
    return [scored[0].id, scored[1].id];
}

/** Build featured id set for matches that share the same calendar day (first match provides YMD). */
export function featuredSetForDayMatches(dayMatches: { kickOff: string; id?: string; eventId?: string }[]): Set<string> {
    if (!dayMatches.length) return new Set();
    const ymd = ymdFromKickOff(dayMatches[0].kickOff);
    if (!ymd) return new Set();
    const sortedIds = [...new Set(dayMatches.map((m) => String(m.id || (m as any).eventId || "")).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
    );
    return new Set(pickVvvipFeaturedMatchIds(sortedIds, ymd));
}
