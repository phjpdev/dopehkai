import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiChevronRight } from "react-icons/hi";
import type { AdminAnalysisEdits, Probability, ResultIA } from "../../../models/probability";
import ThemedText from "../../../components/themedText";
import { formatPickLabel } from "./pick_card";
import { getTeamNameInCurrentLanguage } from "../../../ultis/languageUtils";

type PickKey = "goals" | "had" | "handicap" | "corners";

const ROWS: { key: PickKey; line1: string; line2: string }[] = [
    { key: "goals", line1: "入球", line2: "大細" },
    { key: "had", line1: "主客", line2: "和" },
    { key: "handicap", line1: "讓", line2: "球" },
    { key: "corners", line1: "角球", line2: "大細" },
];

const MODAL_INPUT_CLASS =
    "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black caret-black placeholder:text-neutral-500";

/** Stop OS dark mode from styling native inputs as dark-on-dark inside this light-themed modal. */
const MODAL_PANEL_CLASS =
    "max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 text-black shadow-xl [color-scheme:light] sm:rounded-2xl sm:p-5";

function baselineLabel(key: PickKey, ia?: ResultIA): string {
    const p = ia?.picks?.[key];
    const raw =
        key === "goals"
            ? ia?.picks?.goals?.bestPick ?? ia?.bestPick
            : p?.bestPick ?? "—";
    return formatPickLabel(key, typeof raw === "string" ? raw : "—");
}

function baselineConfidence(key: PickKey, ia?: ResultIA): number {
    const p = ia?.picks?.[key];
    const raw =
        key === "goals"
            ? ia?.picks?.goals?.bestPick ?? ia?.bestPick
            : p?.bestPick ?? "";
    const c = p?.confidence;
    if (typeof c === "number" && c > 0 && Number.isFinite(c)) return Math.round(Math.max(0, Math.min(100, c)));
    if (raw && raw !== "—") return 70;
    return 0;
}

function formatStatWinRateShowing(override: string | undefined, fallbackBase: string | number): string {
    const fb = `${String(fallbackBase).replace(/%/g, "").trim()}%`;
    if (override == null) return fb;
    const o = override.trim();
    if (!o) return fb;
    return o.endsWith("%") ? o : `${o.replace(/%/g, "")}%`;
}

/** Same normalization as team cards on the detail page. */
function pillPercents(probability: Probability): { home: number; away: number } {
    let homeWin = probability.ia && probability.ia.home ? probability.ia.home : (probability.predictions?.homeWinRate ?? 0);
    let awayWin = probability.ia && probability.ia.away ? probability.ia.away : (probability.predictions?.awayWinRate ?? 0);

    if ((!homeWin || homeWin === 0) && (!awayWin || awayWin === 0)) {
        homeWin = 50;
        awayWin = 50;
    } else if (!homeWin || homeWin === 0) {
        homeWin = Math.max(0, Math.min(100, 100 - awayWin));
    } else if (!awayWin || awayWin === 0) {
        awayWin = Math.max(0, Math.min(100, 100 - homeWin));
    }

    const total = homeWin + awayWin;
    if (total > 0 && Math.abs(total - 100) > 0.01) {
        homeWin = (homeWin / total) * 100;
        awayWin = (awayWin / total) * 100;
    }

    const finalTotal = homeWin + awayWin;
    if (Math.abs(finalTotal - 100) > 0.01) {
        if (homeWin >= awayWin) {
            homeWin = 100 - awayWin;
        } else {
            awayWin = 100 - homeWin;
        }
    }

    homeWin = Math.max(0, Math.min(100, homeWin));
    awayWin = Math.max(0, Math.min(100, awayWin));

    const ae = probability.adminAnalysisEdits;
    const pillHome =
        typeof ae?.iaWinPctDisplay?.home === "number" && !Number.isNaN(ae.iaWinPctDisplay.home)
            ? ae.iaWinPctDisplay.home
            : homeWin;
    const pillAway =
        typeof ae?.iaWinPctDisplay?.away === "number" && !Number.isNaN(ae.iaWinPctDisplay.away)
            ? ae.iaWinPctDisplay.away
            : awayWin;

    return {
        home: Math.round(Math.max(0, Math.min(100, pillHome))),
        away: Math.round(Math.max(0, Math.min(100, pillAway))),
    };
}

function statWinRateBaselines(probability: Probability): { home: string; away: string } {
    let homeWin = probability.ia && probability.ia.home ? probability.ia.home : (probability.predictions?.homeWinRate ?? 0);
    let awayWin = probability.ia && probability.ia.away ? probability.ia.away : (probability.predictions?.awayWinRate ?? 0);

    if ((!homeWin || homeWin === 0) && (!awayWin || awayWin === 0)) {
        homeWin = 50;
        awayWin = 50;
    } else if (!homeWin || homeWin === 0) {
        homeWin = Math.max(0, Math.min(100, 100 - awayWin));
    } else if (!awayWin || awayWin === 0) {
        awayWin = Math.max(0, Math.min(100, 100 - homeWin));
    }

    const total = homeWin + awayWin;
    if (total > 0 && Math.abs(total - 100) > 0.01) {
        homeWin = (homeWin / total) * 100;
        awayWin = (awayWin / total) * 100;
    }

    const finalTotal = homeWin + awayWin;
    if (Math.abs(finalTotal - 100) > 0.01) {
        if (homeWin >= awayWin) {
            homeWin = 100 - awayWin;
        } else {
            awayWin = 100 - homeWin;
        }
    }

    homeWin = Math.max(0, Math.min(100, homeWin));
    awayWin = Math.max(0, Math.min(100, awayWin));

    let homeWinRate: string | number = Math.round(homeWin);
    let awayWinRate: string | number = Math.round(awayWin);

    const hasLastGames = !!probability.lastGames?.homeTeam && !!probability.lastGames?.awayTeam;
    if (hasLastGames) {
        const homeStats = probability.lastGames!.homeTeam;
        const homeResults = homeStats.teamForm.split(",");
        const homeWinCount = homeResults.filter((r) => r === "W").length;
        const homeWinRateCalculated = homeResults.length > 0 ? (homeWinCount / homeResults.length) * 100 : 0;
        homeWinRate = homeWinRateCalculated === 0 ? Math.round(homeWin) : homeWinRateCalculated.toFixed(0);

        const awayStats = probability.lastGames!.awayTeam;
        const awayResults = awayStats.teamForm.split(",");
        const awayWinCount = awayResults.filter((r) => r === "W").length;
        const awayWinRateCalculated = awayResults.length > 0 ? (awayWinCount / awayResults.length) * 100 : 0;
        awayWinRate = awayWinRateCalculated === 0 ? Math.round(awayWin) : awayWinRateCalculated.toFixed(0);
    }

    const ae = probability.adminAnalysisEdits;
    return {
        home: formatStatWinRateShowing(ae?.statsWinRateDisplay?.home, homeWinRate),
        away: formatStatWinRateShowing(ae?.statsWinRateDisplay?.away, awayWinRate),
    };
}

interface Props {
    /** When true, show toolbar under match header */
    visible: boolean;
    displayData?: Probability | null;
    patchAdminAnalysis: (p: Partial<AdminAnalysisEdits>) => Promise<void>;
}

/** Bottom-page control that opens a modal to edit displayed analysis (picks, team %, stat win rates). */
export function AdminAnalysisHeaderToolbar({ visible, displayData, patchAdminAnalysis }: Props) {
    const { t } = useTranslation();
    const [modalOpen, setModalOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const ia = displayData?.ia;
    const edits = displayData?.adminAnalysisEdits;

    const [text, setText] = useState<Record<PickKey, string>>({
        goals: "",
        had: "",
        handicap: "",
        corners: "",
    });
    const [pct, setPct] = useState<Record<PickKey, number>>({
        goals: 0,
        had: 0,
        handicap: 0,
        corners: 0,
    });
    const [homePill, setHomePill] = useState(0);
    const [awayPill, setAwayPill] = useState(0);
    const [homeStat, setHomeStat] = useState("");
    const [awayStat, setAwayStat] = useState("");
    const prevModalOpen = useRef(false);

    useEffect(() => {
        if (!visible) {
            setModalOpen(false);
            prevModalOpen.current = false;
        }
    }, [visible]);

    /** Load latest display into the form when the modal opens (avoid resetting on every parent render). */
    useEffect(() => {
        if (!visible || !displayData || !ia) return;
        const justOpened = modalOpen && !prevModalOpen.current;
        prevModalOpen.current = modalOpen;
        if (!justOpened) return;

        const nextText = {} as Record<PickKey, string>;
        const nextPct = {} as Record<PickKey, number>;
        const pd = edits?.pickDisplay;
        const pc = edits?.pickConfidenceDisplay;
        for (const { key } of ROWS) {
            const lbl = pd?.[key]?.trim() ? pd[key]!.trim() : baselineLabel(key, ia);
            nextText[key] = lbl;
            const pv = pc?.[key];
            nextPct[key] =
                typeof pv === "number" && Number.isFinite(pv)
                    ? Math.round(Math.max(0, Math.min(100, pv)))
                    : baselineConfidence(key, ia);
        }
        setText(nextText);
        setPct(nextPct);
        const pills = pillPercents(displayData);
        setHomePill(pills.home);
        setAwayPill(pills.away);
        const stats = statWinRateBaselines(displayData);
        setHomeStat(stats.home.replace(/%/g, ""));
        setAwayStat(stats.away.replace(/%/g, ""));
    }, [visible, modalOpen, displayData, ia, edits?.pickDisplay, edits?.pickConfidenceDisplay, edits?.iaWinPctDisplay, edits?.statsWinRateDisplay]);

    if (!visible || !ia || !displayData) return null;

    async function save() {
        setBusy(true);
        try {
            await patchAdminAnalysis({
                pickDisplay: {
                    goals: text.goals,
                    had: text.had,
                    handicap: text.handicap,
                    corners: text.corners,
                },
                pickConfidenceDisplay: {
                    goals: pct.goals,
                    had: pct.had,
                    handicap: pct.handicap,
                    corners: pct.corners,
                },
                iaWinPctDisplay: {
                    home: homePill,
                    away: awayPill,
                },
                statsWinRateDisplay: {
                    home: homeStat.trim(),
                    away: awayStat.trim(),
                },
            });
            setModalOpen(false);
        } finally {
            setBusy(false);
        }
    }

    const closeLabel =
        t("cancel") !== "cancel" ? t("cancel") : "取消";
    const openModalLabel =
        t("openMatchAnalysisModal") !== "openMatchAnalysisModal"
            ? t("openMatchAnalysisModal")
            : "修改本場分析與顯示";
    const saveLabel = t("save") !== "save" ? t("save") : "儲存";
    const modalTitle =
        t("editMatchAnalysisModalTitle") !== "editMatchAnalysisModalTitle"
            ? t("editMatchAnalysisModalTitle")
            : "編輯場次分析";
    const homeTeamLabel = getTeamNameInCurrentLanguage(displayData.homeLanguages, displayData.homeTeamName);
    const awayTeamLabel = getTeamNameInCurrentLanguage(displayData.awayLanguages, displayData.awayTeamName);

    return (
        <>
            <div id="match-analysis-edit-toolbar" className="sm:w-2/3 w-5/6 mx-auto mt-10 px-1 pb-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-md [color-scheme:light] ring-1 ring-black/10 hover:bg-neutral-50"
                >
                    <span className="text-center leading-snug">{openModalLabel}</span>
                    <HiChevronRight className="h-5 w-5 shrink-0" aria-hidden />
                </button>
            </div>

            {modalOpen ? (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center"
                    role="presentation"
                    onClick={() => !busy && setModalOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="match-analysis-modal-title"
                        className={MODAL_PANEL_CLASS}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="match-analysis-modal-title" className="mb-3 text-center text-base font-bold text-black">
                            {modalTitle}
                        </h2>
                        <ThemedText type="defaultSemiBold" className="mb-4 block text-center text-xs text-black/60">
                            {t("editAnalysisHint") !== "editAnalysisHint"
                                ? t("editAnalysisHint")
                                : "修改下方「分析」文字與右側數值百分比；亦可調整主客隊頭條百分比與統計區勝率顯示。儲存後立即套用。"}
                        </ThemedText>

                        {ROWS.map(({ key, line1, line2 }) => (
                            <div
                                key={key}
                                className="flex flex-col gap-2 border-b border-black/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:gap-3"
                            >
                                <span className="shrink-0 text-xs font-bold text-black sm:w-24">
                                    {line1}
                                    {line2}
                                </span>
                                <label className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span className="text-[10px] text-neutral-500">分析</span>
                                    <input
                                        className={MODAL_INPUT_CLASS}
                                        value={text[key]}
                                        disabled={busy}
                                        onChange={(e) =>
                                            setText((s) => ({ ...s, [key]: e.target.value }))
                                        }
                                    />
                                </label>
                                <label className="flex shrink-0 flex-col gap-1 sm:w-24">
                                    <span className="text-[10px] text-neutral-500">%</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        className={MODAL_INPUT_CLASS}
                                        value={pct[key]}
                                        disabled={busy}
                                        onChange={(e) =>
                                            setPct((s) => ({
                                                ...s,
                                                [key]: Math.round(
                                                    Math.max(
                                                        0,
                                                        Math.min(100, Number(e.target.value) || 0),
                                                    ),
                                                ),
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                        ))}

                        <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
                            <p className="text-center text-[11px] font-bold text-black/70">主客隊顯示</p>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-neutral-500">{homeTeamLabel} — 頭條 %</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className={MODAL_INPUT_CLASS}
                                    value={homePill}
                                    disabled={busy}
                                    onChange={(e) =>
                                        setHomePill(
                                            Math.round(
                                                Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                            ),
                                        )
                                    }
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-neutral-500">{awayTeamLabel} — 頭條 %</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className={MODAL_INPUT_CLASS}
                                    value={awayPill}
                                    disabled={busy}
                                    onChange={(e) =>
                                        setAwayPill(
                                            Math.round(
                                                Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                            ),
                                        )
                                    }
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-neutral-500">{homeTeamLabel} — 統計勝率顯示</span>
                                <input
                                    className={MODAL_INPUT_CLASS}
                                    value={homeStat}
                                    disabled={busy}
                                    placeholder="例如 38 或 38%"
                                    onChange={(e) => setHomeStat(e.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-neutral-500">{awayTeamLabel} — 統計勝率顯示</span>
                                <input
                                    className={MODAL_INPUT_CLASS}
                                    value={awayStat}
                                    disabled={busy}
                                    placeholder="例如 38 或 38%"
                                    onChange={(e) => setAwayStat(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void save()}
                                className="flex-1 rounded-lg border border-neutral-300 bg-white py-2.5 font-semibold text-black [color-scheme:light] hover:bg-neutral-50 disabled:opacity-50"
                            >
                                {saveLabel}
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-black [color-scheme:light] hover:bg-neutral-50"
                            >
                                {closeLabel}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
