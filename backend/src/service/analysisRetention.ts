/**
 * Retention for MongoDB `analysis` collection: same HK calendar window as admin past-results
 * (yesterday + day-before). Older analysis rows are removed so the DB does not grow forever.
 */
import { connectMongo, isMongoEnabled } from "../database/mongodb";
import { getModel } from "../database/models";
import { cacheDel, CacheKeys } from "../cache/redis";

const pad = (n: number) => String(n).padStart(2, "0");

/** "MM/DD/YYYY" or "DD/MM/YYYY" (if a part > 12, disambiguate) → YYYY-MM-DD for +08 parsing. */
function slashDatePartToYmd(dp: string): string | null {
    const parts = dp.trim().split("/").map((p) => p.trim());
    if (parts.length !== 3) return null;
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    const c = parseInt(parts[2], 10);
    if (![a, b, c].every((n) => Number.isFinite(n))) return null;
    let y: number;
    let month: number;
    let day: number;
    if (c >= 1000) {
        y = c;
        if (a > 12) {
            day = a;
            month = b;
        } else if (b > 12) {
            month = a;
            day = b;
        } else {
            month = a;
            day = b;
        }
    } else if (a >= 1000) {
        y = a;
        month = b;
        day = c;
    } else {
        return null;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${pad(month)}-${pad(day)}`;
}

function normalizeTimePart(tp: string): string {
    const t = tp.trim();
    if (t.length >= 5 && /^\d{1,2}:\d{2}/.test(t)) {
        const [h, m] = t.split(":");
        return `${pad(parseInt(h, 10))}:${pad(parseInt(m, 10))}`;
    }
    return "12:00";
}

/** Parse match kickOff string to epoch ms (HKJC / FootyLogic use local +08 for space-separated). */
export function kickOffStringToMs(kickOff: string): number | null {
    try {
        if (!kickOff) return null;
        if (kickOff.includes("T")) {
            const d = new Date(kickOff);
            return isNaN(d.getTime()) ? null : d.getTime();
        }
        const [rawDp, ...rest] = kickOff.trim().split(/\s+/);
        const dp = rawDp || "";
        const tp = rest.join(" ");
        if (!dp) return null;
        const time = tp && tp.length >= 4 ? normalizeTimePart(tp) : "12:00";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dp)) {
            const d = new Date(`${dp}T${time}:00+08:00`);
            return isNaN(d.getTime()) ? null : d.getTime();
        }
        const ymd = slashDatePartToYmd(dp);
        if (ymd) {
            const d = new Date(`${ymd}T${time}:00+08:00`);
            return isNaN(d.getTime()) ? null : d.getTime();
        }
        const d = new Date(`${dp}T${time}:00+08:00`);
        return isNaN(d.getTime()) ? null : d.getTime();
    } catch {
        return null;
    }
}

/** Start of HKT midnight for calendar day (today - 2): keep analysis for kickoffs on that instant or later. */
export function getAnalysisRetentionCutoffMs(): number {
    const toHktYmd = (d: Date) =>
        d.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" });
    const ymdAddDaysHkt = (ymd: string, delta: number): string => {
        const [y, m, day] = ymd.split("-").map(Number);
        const anchor = new Date(`${y}-${pad(m)}-${pad(day)}T12:00:00+08:00`);
        anchor.setTime(anchor.getTime() + delta * 86400000);
        return toHktYmd(anchor);
    };
    const startOfHktYmdMs = (ymd: string) => {
        const [y, m, day] = ymd.split("-").map(Number);
        return new Date(`${y}-${pad(m)}-${pad(day)}T00:00:00+08:00`).getTime();
    };
    const todayHkt = toHktYmd(new Date());
    const startYmd = ymdAddDaysHkt(todayHkt, -2);
    return startOfHktYmdMs(startYmd);
}

/** Delete `analysis` docs where `analysisKickOffMs` is before the HK two-day retention window. */
export async function pruneAnalysisCollection(): Promise<{ deleted: number; skipped: boolean }> {
    if (!isMongoEnabled()) {
        return { deleted: 0, skipped: true };
    }
    try {
        await connectMongo();
        const cutoff = getAnalysisRetentionCutoffMs();
        const Model = getModel("analysis");
        const res = await Model.deleteMany({ analysisKickOffMs: { $lt: cutoff } });
        const deleted = typeof res.deletedCount === "number" ? res.deletedCount : 0;
        if (deleted > 0) {
            console.log("[pruneAnalysis] Removed", deleted, "analysis doc(s) with kickoff before", new Date(cutoff).toISOString());
            await cacheDel(CacheKeys.analysisAll());
        }
        return { deleted, skipped: false };
    } catch (e) {
        console.warn("[pruneAnalysis] Failed:", e);
        return { deleted: 0, skipped: false };
    }
}
