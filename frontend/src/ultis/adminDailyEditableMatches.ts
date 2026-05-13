/**
 * Each calendar day (Asia/Hong_Kong), picks a deterministic pseudo-random pair of matches (Hong Kong kickoff date).
 * Those fixtures: editable analysis semantics on the backend and omitted from `/matches` for non-staff clients.
 * Kept in sync with backend/src/service/adminDailyEditableMatches.ts
 */

export function kickOffDateKeyHongKong(kickOff: string | undefined | null): string | null {
    if (!kickOff) return null;
    try {
        const d = kickOff.includes("T") ? new Date(kickOff) : new Date(kickOff.replace(" ", "T"));
        if (isNaN(d.getTime())) return null;
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Hong_Kong",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(d);
    } catch {
        return null;
    }
}

function hashString(s: string): number {
    let h = 5381 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
    }
    return h >>> 0;
}

/** Pick two distinct ids from a sorted list; order of returned pair is sorted lexicographically. */
export function pickTwoDistinctSortedIds(sortedIds: string[], dayKey: string): string[] {
    const n = sortedIds.length;
    if (n === 0) return [];
    if (n === 1) return [sortedIds[0]];
    const base = `${dayKey}::${sortedIds.join(",")}`;
    const h1 = hashString(base + "::a");
    let i = h1 % n;
    const h2 = hashString(base + "::b");
    let j = h2 % n;
    let guard = 0;
    while (j === i && guard <= n) {
        j = (j + 1) % n;
        guard++;
    }
    if (j === i) return [sortedIds[0], sortedIds[1]];
    const a = sortedIds[i];
    const b = sortedIds[j];
    return a.localeCompare(b) < 0 ? [a, b] : [b, a];
}

/** Pass the same match pool for everyone (typically live API list) so list + detail flags stay aligned. */
export function buildAdminDailyEditableIdSet(
    matches: Array<{ id?: string; eventId?: string; kickOff?: string }>
): Set<string> {
    const byDay = new Map<string, string[]>();
    for (const m of matches) {
        const id = String(m.id || m.eventId || "");
        if (!id || !m.kickOff) continue;
        const dayKey = kickOffDateKeyHongKong(m.kickOff);
        if (!dayKey) continue;
        let arr = byDay.get(dayKey);
        if (!arr) {
            arr = [];
            byDay.set(dayKey, arr);
        }
        if (!arr.includes(id)) arr.push(id);
    }
    const chosen = new Set<string>();
    for (const [dayKey, ids] of byDay) {
        const sorted = [...ids].sort((a, b) => a.localeCompare(b));
        for (const x of pickTwoDistinctSortedIds(sorted, dayKey)) {
            chosen.add(x);
        }
    }
    return chosen;
}

export function annotateMatchesWithAdminDailyEditable(
    matches: Array<{ id?: string; eventId?: string; kickOff?: string; adminDailyEditableAnalysis?: boolean }>
): void {
    const set = buildAdminDailyEditableIdSet(matches);
    for (const m of matches) {
        const id = String(m.id || m.eventId || "");
        m.adminDailyEditableAnalysis = id ? set.has(id) : false;
    }
}
