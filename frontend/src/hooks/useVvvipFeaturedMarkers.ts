import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import useAuthStore from "../store/userAuthStore";
import AppGlobal from "../ultis/global";
import API from "../api/api";
import { pickVvvipFeaturedMatchIds, ymdFromKickOff } from "../ultis/vvvipFeaturedMatches";
import type { Match } from "../models/match";

const EMPTY_ID_SET = new Set<string>();

function extractMatchsFromCache(queryClient: QueryClient): Match[] | null {
    const entries = queryClient.getQueriesData<Match[]>({ queryKey: ["matchs"] });
    const merged: Match[] = [];
    const seen = new Set<string>();
    for (const [, data] of entries) {
        if (!Array.isArray(data)) continue;
        for (const m of data) {
            const id = String((m as Match).id || (m as any).eventId || "");
            if (!id || seen.has(id)) continue;
            seen.add(id);
            merged.push(m);
        }
    }
    return merged.length ? merged : null;
}

/** Admin / subadmin / active VVVIP member — can see featured markers and 預測比分 panel. */
export function useCanSeeVvvipFeaturedContent(): boolean {
    const { userRole } = useAuthStore();
    const [vvvipOk, setVvvipOk] = useState(false);

    useEffect(() => {
        if (userRole === "admin" || userRole === "subadmin") {
            setVvvipOk(false);
            return;
        }
        if (!userRole) {
            setVvvipOk(false);
            return;
        }
        let cancelled = false;
        API.GET(AppGlobal.baseURL + "user/verify/vvvip")
            .then((res) => {
                if (!cancelled) setVvvipOk(res.status === 200);
            })
            .catch(() => {
                if (!cancelled) setVvvipOk(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userRole]);

    return userRole === "admin" || userRole === "subadmin" || vvvipOk;
}

/**
 * For a kick-off day (YYYY-MM-DD), returns the two featured match ids, or null while resolving.
 */
/**
 * `null` = still resolving; then a (possibly empty) Set of the two featured ids for that calendar day.
 */
export function useVvvipFeaturedIdsForDay(kickOff: string | undefined): Set<string> | null {
    const queryClient = useQueryClient();
    const ymd = useMemo(() => ymdFromKickOff(kickOff), [kickOff]);
    /** `undefined` = loading; array = resolved (0–2 ids). */
    const [pair, setPair] = useState<string[] | undefined>(undefined);

    useEffect(() => {
        if (!ymd) {
            setPair(undefined);
            return;
        }
        setPair(undefined);
        let cancelled = false;
        (async () => {
            let list = extractMatchsFromCache(queryClient);
            if (!list || list.length === 0) {
                const res = await API.GET(AppGlobal.baseURL + "match/match-data");
                if (res.status === 200 && Array.isArray(res.data)) {
                    list = res.data as Match[];
                }
            }
            if (cancelled) return;
            if (!list || list.length === 0) {
                setPair([]);
                return;
            }
            const sameDay = list.filter((m) => ymdFromKickOff(m.kickOff) === ymd);
            const sortedIds = sameDay
                .map((m) => String((m as Match).id || (m as any).eventId || ""))
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
            const picked = pickVvvipFeaturedMatchIds(sortedIds, ymd);
            if (!cancelled) setPair(picked);
        })();
        return () => {
            cancelled = true;
        };
    }, [ymd, queryClient]);

    if (!ymd) return EMPTY_ID_SET;
    if (pair === undefined) return null;
    return new Set(pair);
}
