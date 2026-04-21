import AppAssets from "../../../ultis/assets";
import ThemedText from "../../../components/themedText";

interface Props {
    typeLine1: string;
    typeLine2: string;
    bestPick: string;
    confidence: number;
    loading?: boolean;
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

function PickCard({ typeLine1, typeLine2, bestPick, confidence, loading }: Props) {
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
                ) : (
                    <div className="flex-1 flex items-center justify-center min-w-0">
                        <ThemedText className="text-sm text-gray-500 whitespace-nowrap" type="default">分析：</ThemedText>
                        <ThemedText className="text-sm font-bold text-black ml-1 truncate min-w-0" type="defaultSemiBold">
                            {bestPick}
                        </ThemedText>
                    </div>
                )}
                <CircularProgress value={confidence} spinning={loading} />
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

export function LockedPickCard({ typeLine1, typeLine2 }: { typeLine1: string; typeLine2: string }) {
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
                    <ThemedText className="text-sm text-gray-400" type="default">
                        VVIP 會員專享
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
