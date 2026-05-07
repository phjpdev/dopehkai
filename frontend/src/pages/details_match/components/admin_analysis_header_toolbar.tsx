import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiChevronDown, HiChevronUp, HiPencil } from "react-icons/hi";
import type { AdminAnalysisEdits, Probability, ResultIA } from "../../../models/probability";
import ThemedText from "../../../components/themedText";
import { formatPickLabel } from "./pick_card";
import AppColors from "../../../ultis/colors";

type PickKey = "goals" | "had" | "handicap" | "corners";

const ROWS: { key: PickKey; line1: string; line2: string }[] = [
    { key: "goals", line1: "入球", line2: "大細" },
    { key: "had", line1: "主客", line2: "和" },
    { key: "handicap", line1: "讓", line2: "球" },
    { key: "corners", line1: "角球", line2: "大細" },
];

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

interface Props {
    /** When true, show toolbar under match header */
    visible: boolean;
    displayData?: Probability | null;
    patchAdminAnalysis: (p: Partial<AdminAnalysisEdits>) => Promise<void>;
}

/** Prominent edit control below the fixture header; expands into inputs for labels + %. */
export function AdminAnalysisHeaderToolbar({ visible, displayData, patchAdminAnalysis }: Props) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
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

    useEffect(() => {
        if (!visible || !ia) return;
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
    }, [visible, ia, edits?.pickDisplay, edits?.pickConfidenceDisplay]);

    if (!visible || !ia) return null;

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
            });
            setExpanded(false);
        } finally {
            setBusy(false);
        }
    }

    const collapseLabel =
        t("collapse") !== "collapse" ? t("collapse") : "Close";
    const editAnalysisLabel =
        t("editMatchAnalysis") !== "editMatchAnalysis" ? t("editMatchAnalysis") : "編輯場次分析";
    const saveLabel = t("save") !== "save" ? t("save") : "儲存";

    return (
        <div id="match-analysis-edit-toolbar" className="sm:w-2/3 w-5/6 mx-auto mt-2 px-1">
            <button
                type="button"
                disabled={busy}
                onClick={() => setExpanded((x) => !x)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-md ring-1 ring-black/10 hover:bg-neutral-50"
            >
                <HiPencil className="h-4 w-4 shrink-0" />
                <span>{expanded ? collapseLabel : editAnalysisLabel}</span>
                {expanded ? (
                    <HiChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                    <HiChevronDown className="h-4 w-4 shrink-0" />
                )}
            </button>

            {expanded ? (
                <div className="mt-3 space-y-3 rounded-xl bg-white p-4 shadow-md ring-1 ring-black/10">
                    <ThemedText type="defaultSemiBold" className="text-center text-xs text-black/60">
                        {t("editAnalysisHint") !== "editAnalysisHint"
                            ? t("editAnalysisHint")
                            : "修改下方「分析」文字與右側數值百分比；儲存後會套用於本案四張分析卡。"}
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
                                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-black"
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
                                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-black"
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
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void save()}
                            className="flex-1 rounded-lg py-2.5 font-semibold text-black"
                            style={{ backgroundColor: AppColors.primary }}
                        >
                            {saveLabel}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setExpanded(false)}
                            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50"
                        >
                            {collapseLabel}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
