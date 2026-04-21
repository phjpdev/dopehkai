import { useCallback, useEffect, useState } from "react";
import AppBarComponent from "../../../components/appBar";
import ThemedText from "../../../components/themedText";
import AppGlobal from "../../../ultis/global";
import API from "../../../api/api";
import { formatPickLabel } from "../../details_match/components/pick_card";

type GeminiStatus = "cached" | "refreshed" | "skipped" | "failed";

interface PastRow {
    id: string;
    kickOff: string;
    homeTeamName: string;
    awayTeamName: string;
    competitionName?: string;
    outcomeName?: string;
    matchOutcome?: string;
    ia?: {
        home: number;
        away: number;
        draw?: number;
        picks?: {
            goals?: { bestPick: string; confidence: number };
            had?: { bestPick: string; confidence: number };
            handicap?: { bestPick: string; confidence: number };
            corners?: { bestPick: string; confidence: number };
        };
    };
    geminiStatus: GeminiStatus;
    geminiMessage?: string;
}

interface PastPayload {
    timezone: string;
    window: { start: string; end: string };
    matches: PastRow[];
}

function PastMatchesAdminPage() {
    const [data, setData] = useState<PastPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await API.GET(`${AppGlobal.baseURL}match/past-results`, {}, 240000);
        if (res.status !== 200) {
            setError(typeof res.data?.message === "string" ? res.data.message : res.data?.error || `HTTP ${res.status}`);
            setData(null);
        } else {
            setData(res.data as PastPayload);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-black text-white">
            <AppBarComponent />
            <div className="mt-24 flex justify-center px-3 sm:px-0">
                <div className="w-full sm:w-5/6 max-w-5xl pb-16">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <ThemedText type="defaultSemiBold" className="text-xl sm:text-2xl" colorText="orange">
                            過去兩日賽果（香港時間）
                        </ThemedText>
                        <button
                            type="button"
                            onClick={() => load()}
                            disabled={loading}
                            className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/10 disabled:opacity-50"
                        >
                            重新載入
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="h-12 w-12 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="rounded-lg bg-red-900/40 p-4 text-red-200">{error}</div>
                    ) : data ? (
                        <>
                            <p className="mb-4 text-sm text-gray-400">
                                範圍：{data.window.start} 至 {data.window.end}（{data.timezone}）
                                <br />
                                已存於資料庫且四項推介齊全的賽事會直接顯示；否則會再次呼叫 Gemini 分析並寫回資料庫。
                            </p>
                            {data.matches.length === 0 ? (
                                <p className="text-gray-400">此兩日內沒有符合的賽事紀錄。</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.matches.map((m) => (
                                        <div
                                            key={m.id}
                                            className="rounded-xl border border-white/10 bg-gray-900/80 p-4 text-sm shadow-lg"
                                        >
                                            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                                                <span className="font-mono text-xs text-gray-400">{m.kickOff}</span>
                                                <span
                                                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                                        m.geminiStatus === "cached"
                                                            ? "bg-emerald-900/60 text-emerald-200"
                                                            : m.geminiStatus === "refreshed"
                                                              ? "bg-amber-900/60 text-amber-200"
                                                              : m.geminiStatus === "skipped"
                                                                ? "bg-gray-700 text-gray-300"
                                                                : "bg-red-900/60 text-red-200"
                                                    }`}
                                                >
                                                    {m.geminiStatus === "cached" && "已快取"}
                                                    {m.geminiStatus === "refreshed" && "已更新 Gemini"}
                                                    {m.geminiStatus === "skipped" && "略過（無賠率資料）"}
                                                    {m.geminiStatus === "failed" && "Gemini 失敗"}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-base font-bold text-white">
                                                {m.homeTeamName} <span className="text-gray-500">vs</span> {m.awayTeamName}
                                            </p>
                                            {m.competitionName ? (
                                                <p className="text-xs text-gray-500">{m.competitionName}</p>
                                            ) : null}
                                            {(m.outcomeName || m.matchOutcome) && (
                                                <p className="mt-1 text-xs text-gray-300">
                                                    賽果：{m.outcomeName || "—"}
                                                    {m.matchOutcome ? `（${m.matchOutcome}）` : ""}
                                                </p>
                                            )}
                                            {m.ia && (
                                                <div className="mt-2 grid gap-1 text-xs text-gray-200 sm:grid-cols-2">
                                                    <span>
                                                        模型主客%：主 {Math.round(m.ia.home)}% / 客 {Math.round(m.ia.away)}%
                                                    </span>
                                                    {m.ia.picks?.goals?.bestPick && (
                                                        <span>
                                                            入球大細：{formatPickLabel("goals", m.ia.picks.goals.bestPick)}（
                                                            {m.ia.picks.goals.confidence ?? "—"}%）
                                                        </span>
                                                    )}
                                                    {m.ia.picks?.had?.bestPick && (
                                                        <span>
                                                            主客和：{formatPickLabel("had", m.ia.picks.had.bestPick)}（
                                                            {m.ia.picks.had.confidence ?? "—"}%）
                                                        </span>
                                                    )}
                                                    {m.ia.picks?.handicap?.bestPick && (
                                                        <span>
                                                            讓球：{formatPickLabel("handicap", m.ia.picks.handicap.bestPick)}（
                                                            {m.ia.picks.handicap.confidence ?? "—"}%）
                                                        </span>
                                                    )}
                                                    {m.ia.picks?.corners?.bestPick && (
                                                        <span>
                                                            角球：{formatPickLabel("corners", m.ia.picks.corners.bestPick)}（
                                                            {m.ia.picks.corners.confidence ?? "—"}%）
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {m.geminiMessage && (
                                                <p className="mt-2 text-xs text-amber-200/90">{m.geminiMessage}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default PastMatchesAdminPage;
