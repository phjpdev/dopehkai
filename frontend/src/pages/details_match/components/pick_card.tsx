import AppAssets from "../../../ultis/assets";
import ThemedText from "../../../components/themedText";
import { HiCheck, HiPencil, HiX } from "react-icons/hi";
import { useEffect, useState } from "react";

interface Props {
    typeLine1: string;
    typeLine2: string;
    bestPick: string;
    confidence: number;
    loading?: boolean;
    /** When set with onCommitDisplayText, admin may change the centred “分析” label. */
    adminEditActive?: boolean;
    onCommitDisplayText?: (value: string) => Promise<void>;
}

// Convert AI English codes to Chinese display labels
export function formatPickLabel(pickType: "goals" | "had" | "handicap" | "corners", code: string): string {
    if (!code || code === "—") return "—";

    if (pickType === "goals" || pickType === "corners") {
        const m = code.match(/^(OVER|UNDER)_(\d+\.?\d*)$/);
        if (m) return m[1] === "OVER" ? `大${m[2]}` : `細${m[2]}`;
    }

    if (pickType === "had") {
        const map: Record<string, string> = { HOME: "主勝", DRAW: "和局", AWAY: "客勝" };
        return map[code] ?? code;
    }

    if (pickType === "handicap") {
        if (code === "LEVEL") return "平手讓球";
        const m = code.match(/^(HOME|AWAY)_([+-]?\d+\.?\d*)$/);
        if (m) return m[1] === "HOME" ? `主受讓${m[2]}` : `客受讓${m[2]}`;
    }

    return code;
}

function CircularProgress({ value, spinning }: { value: number; spinning?: boolean }) {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
            <svg
                className={`absolute top-0 left-0 w-full h-full -rotate-90${spinning ? " animate-spin" : ""}`}
                viewBox="0 0 50 50"
            >
                <circle cx="25" cy="25" r={radius} fill="#1a2744" stroke="#1a2744" strokeWidth="2" />
                <circle
                    cx="25" cy="25" r={radius}
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={spinning ? circumference * 0.75 : strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            {!spinning && (
                <span className="text-xs font-bold text-white z-10 relative">{value}%</span>
            )}
        </div>
    );
}

function PickCard({
    typeLine1,
    typeLine2,
    bestPick,
    confidence,
    loading,
    adminEditActive,
    onCommitDisplayText,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(bestPick);
    const [saveBusy, setSaveBusy] = useState(false);

    useEffect(() => {
        if (!editing) setDraft(bestPick);
    }, [bestPick, editing]);

    const canAdminEdit = Boolean(adminEditActive && onCommitDisplayText);

    async function confirmEdit() {
        if (!onCommitDisplayText) return;
        const v = draft.trim();
        setSaveBusy(true);
        try {
            await onCommitDisplayText(v);
            setEditing(false);
        } catch {
            /* keep editing open */
        } finally {
            setSaveBusy(false);
        }
    }

    function cancelEdit() {
        setDraft(bestPick);
        setEditing(false);
    }

    return (
        <div className="sm:w-2/3 w-5/6 mx-auto bg-white rounded-xl mt-3 overflow-hidden shadow-sm">
            <div className="flex flex-nowrap items-center px-4 py-3 gap-3">
                <div className="flex-shrink-0 pr-1">
                    <ThemedText
                        className="font-bold text-sm text-black whitespace-nowrap leading-tight"
                        type="defaultSemiBold"
                    >
                        {typeLine1}
                        {typeLine2}
                    </ThemedText>
                </div>
                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-w-0">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-yellow-400 rounded-full animate-spin" />
                    </div>
                ) : editing ? (
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0 px-1">
                        <label className="sr-only">Edit analysis label</label>
                        <input
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-black"
                            value={draft}
                            disabled={saveBusy}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") void confirmEdit();
                                if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                        />
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                className="p-1 rounded text-green-700 hover:bg-green-50 disabled:opacity-40"
                                disabled={saveBusy}
                                onClick={() => void confirmEdit()}
                                aria-label="Save"
                            >
                                <HiCheck className="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-40"
                                disabled={saveBusy}
                                onClick={cancelEdit}
                                aria-label="Cancel"
                            >
                                <HiX className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center min-w-0 gap-1">
                        <ThemedText className="text-sm text-gray-500 whitespace-nowrap" type="default">分析：</ThemedText>
                        <ThemedText className="text-sm font-bold text-black ml-1 truncate min-w-0" type="defaultSemiBold">
                            {bestPick}
                        </ThemedText>
                        {canAdminEdit ? (
                            <button
                                type="button"
                                className="ml-1 shrink-0 p-1 rounded text-gray-700 hover:bg-gray-100"
                                aria-label="Edit analysis text"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing(true);
                                }}
                            >
                                <HiPencil className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                            </button>
                        ) : null}
                    </div>
                )}
                <CircularProgress value={confidence} spinning={loading || saveBusy} />
            </div>
            <div className="w-full h-1.5 bg-gray-100">
                {!loading && confidence > 0 && (
                    <div
                        className="h-full rounded-r-full"
                        style={{
                            width: `${confidence}%`,
                            background: 'linear-gradient(to right, rgba(234,179,8,0.2), rgba(234,179,8,1))',
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export function LockedPickCard({
    typeLine1,
    typeLine2,
    lockHint = "VVIP 會員專享",
}: {
    typeLine1: string;
    typeLine2: string;
    /** Shown for VIP (VVIP-only picks) vs normal (all picks locked). */
    lockHint?: string;
}) {
    return (
        <div className="sm:w-2/3 w-5/6 mx-auto bg-white rounded-xl mt-3 overflow-hidden shadow-sm">
            <div className="flex flex-nowrap items-center px-4 py-3 gap-3">
                <div className="flex-shrink-0 pr-1">
                    <ThemedText
                        className="font-bold text-sm text-black whitespace-nowrap leading-tight"
                        type="defaultSemiBold"
                    >
                        {typeLine1}
                        {typeLine2}
                    </ThemedText>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                    <img src={AppAssets.lock} alt="Lock" className="w-5 h-5 opacity-60" />
                    <ThemedText className="text-sm text-gray-400 whitespace-nowrap truncate" type="default">
                        {lockHint}
                    </ThemedText>
                </div>
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <img src={AppAssets.lock} alt="Lock" className="w-6 h-6 opacity-30" />
                </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100" />
        </div>
    );
}

export default PickCard;
