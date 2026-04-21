import { useState } from "react";
import { FaBasketball } from "react-icons/fa6";
import { NavigateFunction } from "react-router-dom";
import { Match } from "../models/match";
import { useTranslation } from "react-i18next";
import moment from 'moment-timezone';
import { Probability } from "../models/probability";
import Crown from "./crown";
import AppAssets from "../ultis/assets";
import { getLeagueFlagUrl } from "../ultis/leagueFlag";

export type Props = {
    teams: string[]
    id?: string
    widht?: any,
    crownPosition?: "centerRight" | "topCenter" | "leagueRowRight" | "cardTopRight"
    /** W/L/D form badges under team names — only used on the match detail header. */
    showFormBadges?: boolean
    match: Match | Probability
    navigate: NavigateFunction
};

function FormBadges({ form }: { form?: string }) {
    if (!form) return null;
    const results = form.split(',').filter(Boolean).slice(-4);
    if (results.length === 0) return null;
    return (
        <div className="flex flex-row gap-0.5 mt-1">
            {results.map((z, i) => (
                <div
                    key={i}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center"
                    style={{ backgroundColor: z === 'D' ? '#f97316' : z === 'L' ? '#ef4444' : '#22c55e' }}
                >
                    <span className="text-white text-[7px] sm:text-[9px] font-bold">{z}</span>
                </div>
            ))}
        </div>
    );
}

export function CardMatch({
    teams,
    id,
    crownPosition = "centerRight",
    showFormBadges = false,
    navigate,
    match,
}: Props) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const dateStr = match.kickOff;
    moment.locale('zh-hk');
    const kickOffMoment = dateStr.includes('T')
        ? moment.tz(dateStr, 'Asia/Hong_Kong')
        : moment.tz(dateStr, 'YYYY-MM-DD HH:mm', 'Asia/Hong_Kong');

    const day = kickOffMoment.date();
    const chineseShortMonths = [
        t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'),
        t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')
    ];
    const month = chineseShortMonths[kickOffMoment.month()];
    const centerDate = kickOffMoment.format('MMM D');
    const kickOffTime = kickOffMoment.format('HH:mm');

    // Countdown until kickoff
    const diffMinutes = kickOffMoment.diff(moment(), 'minutes');
    let countdown: string | null = null;
    if (diffMinutes > 0) {
        countdown = diffMinutes >= 60 ? `in ${Math.floor(diffMinutes / 60)}h` : `in ${diffMinutes}m`;
    }

    const homeWin = match.ia?.home ?? match.predictions?.homeWinRate ?? null;
    const awayWin = match.ia?.away ?? match.predictions?.awayWinRate ?? null;
    const higherWinRate = homeWin != null && awayWin != null
        ? Math.max(homeWin, awayWin)
        : (homeWin ?? awayWin ?? 0);

    const leagueCode = (match as Match).leagueCode;
    const competitionName = (match as Match).competitionName;
    const flagUrl = getLeagueFlagUrl(leagueCode);

    const lg = match.lastGames;
    const homeForm =
        match.homeForm || (showFormBadges ? lg?.homeTeam?.teamForm : "") || "";
    const awayForm =
        match.awayForm || (showFormBadges ? lg?.awayTeam?.teamForm : "") || "";

    const handleClick = async () => {
        if (id) {
            try {
                sessionStorage.setItem("lastMatchId", String(id));
                sessionStorage.setItem("lastMatchFrom", window.location.pathname || "");
            } catch { }
            navigate("/details-match/" + id);
        }
    };

    return (
        <>
            <div className="relative mb-1">
                {higherWinRate > 70 && crownPosition === "topCenter" && (
                    <div
                        className="absolute -top-5 left-1/2 -translate-x-1/2 ml-4 sm:ml-5 z-10 rounded-md px-2 py-1 shadow-sm flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.9) 100%)' }}
                    >
                        <Crown winRate={higherWinRate} size="w-4 sm:w-5" />
                    </div>
                )}
                <div
                    onClick={handleClick}
                    className="flex rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer w-full"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.9) 100%)' }}
                >
                    {/* Date column */}
                    <div className="bg-black text-white sm:w-14 w-10 flex flex-col items-center justify-center py-3 text-center flex-shrink-0">
                        <span className="sm:text-2xl text-lg font-bold leading-none">{day}</span>
                        <span className="text-[10px] sm:text-xs font-semibold mt-0.5">{month.toUpperCase()}</span>
                    </div>

                    {/* Main content — relative so cardTopRight crowns sit above away column */}
                    <div className="relative flex flex-1 items-center justify-between py-3 px-2 sm:px-4 gap-1">
                        {higherWinRate > 70 && crownPosition === "cardTopRight" && (
                            <div className="absolute top-1 right-2 sm:top-1.5 sm:right-3 z-10 pointer-events-none flex items-center">
                                <Crown winRate={higherWinRate} size="w-3 sm:w-3.5" />
                            </div>
                        )}

                        {/* Home team */}
                        <div className="flex flex-col items-center flex-1 min-w-0">
                            <img
                                src={match.homeTeamLogo || AppAssets.logo_black}
                                alt={teams[0]}
                                className="sm:w-14 sm:h-14 w-10 h-10 object-contain"
                                loading="lazy"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = AppAssets.logo_black;
                                }}
                            />
                            <p className="sm:text-sm text-[10px] font-bold mt-1 text-center text-gray-800 leading-tight"
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', maxWidth: 90 }}>
                                {teams[0]}
                            </p>
                            {showFormBadges ? <FormBadges form={homeForm} /> : null}
                        </div>

                        {/* Center info */}
                        <div className="relative flex flex-col items-center justify-center gap-0.5 flex-shrink-0 px-1 sm:px-2 min-w-[6.5rem] sm:min-w-[8.5rem]">
                            {/* League flag + name (+ crowns for details header) */}
                            <div className="flex flex-row items-center gap-1 w-full">
                                <div className="flex flex-row items-center gap-1 min-w-0 flex-1">
                                    {flagUrl && (
                                        <img
                                            src={flagUrl}
                                            alt={competitionName || leagueCode || ""}
                                            title={competitionName || ""}
                                            className="h-3 w-4 sm:h-3.5 sm:w-6 object-cover rounded-[1px] flex-shrink-0"
                                            onError={(e: any) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    {(competitionName || leagueCode) && (
                                        <span className="text-[7px] sm:text-[9px] font-semibold text-gray-600 min-w-0" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {competitionName || leagueCode}
                                        </span>
                                    )}
                                </div>
                                {higherWinRate > 70 && crownPosition === "leagueRowRight" && (
                                    <div className="flex-shrink-0 flex items-center justify-end self-start pt-0.5 pointer-events-none">
                                        <Crown winRate={higherWinRate} size="w-3 sm:w-3.5" />
                                    </div>
                                )}
                            </div>

                            {/* VS */}
                            <span className="text-base sm:text-lg font-bold text-gray-800">VS</span>

                            {/* Date */}
                            <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium">{centerDate}</span>

                            {/* Time */}
                            <span className="text-sm sm:text-base font-bold" style={{ color: '#eab308' }}>{kickOffTime}</span>

                            {/* Countdown or result statistics icon */}
                            {countdown ? (
                                <div className="flex items-center gap-0.5">
                                    <span className="text-[8px] sm:text-[10px] text-gray-400">⏱ {countdown}</span>
                                </div>
                            ) : (
                                <div className="flex flex-row items-center gap-1">
                                    <FaBasketball color="#000000" size={8} />
                                    <span className="text-[6px] sm:text-[8px] font-semibold text-black/60">{t("resultStatistics")}</span>
                                </div>
                            )}

                            {/* Crown shown near center info (requested position) */}
                            {higherWinRate > 70 && crownPosition === "centerRight" && (
                                <div className="absolute top-1/2 -right-4 sm:-right-5 -translate-y-1/2 z-10">
                                    <Crown winRate={higherWinRate} size="w-4 sm:w-5" />
                                </div>
                            )}
                        </div>

                        {/* Away team */}
                        <div className="flex flex-col items-center flex-1 min-w-0">
                            <img
                                src={match.awayTeamLogo || AppAssets.logo_black}
                                alt={teams[1]}
                                className="sm:w-14 sm:h-14 w-10 h-10 object-contain"
                                loading="lazy"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = AppAssets.logo_black;
                                }}
                            />
                            <p className="sm:text-sm text-[10px] font-bold mt-1 text-center text-gray-800 leading-tight"
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', maxWidth: 90 }}>
                                {teams[1]}
                            </p>
                            {showFormBadges ? <FormBadges form={awayForm} /> : null}
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal VIP */}
            {showModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white p-6 rounded shadow-lg max-w-xs w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="mb-4 text-center text-black font-semibold">
                            {t("you_need_to_be_VIP")}
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                className="text-black px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                                onClick={() => setShowModal(false)}
                            >
                                {t("cancel")}
                            </button>
                            <button
                                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                                onClick={() => { window.location.href = "/"; setShowModal(false); }}
                            >
                                {t("Contact_Us")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
