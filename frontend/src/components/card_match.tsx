import { useState } from "react";
import { FaBasketball } from "react-icons/fa6";
import { FaFutbol } from "react-icons/fa";
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
    /** VVVIP/admin: marks one of the two daily “featured” matches (預測比分 on detail). */
    showVvvipFeaturedMarker?: boolean
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
    showVvvipFeaturedMarker = false,
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

                    {/* Main content — relative for absolute corner markers (crowns, VVVIP balls) */}
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

                        {/* Center info — min-w-0 + wrap so long league names / dates do not crush teammates */}
                        <div className="relative flex min-w-0 max-w-[42%] sm:max-w-[36%] flex-col items-center justify-center gap-0.5 px-0.5 sm:px-2">
                            {/* League flag + name (+ crowns for details header) */}
                            <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0">
                                <div className="flex min-w-0 max-w-full flex-row flex-wrap items-center justify-center gap-1">
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
                                        <span className="text-center text-[7px] font-semibold leading-tight text-gray-600 sm:text-[9px] whitespace-normal break-words">
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

                            {/* Date / time — stacked lines so long locales stay readable */}
                            <div className="flex flex-col items-center gap-0.5 text-center">
                                <span className="text-[9px] font-medium leading-tight text-gray-500 sm:text-[11px]">{centerDate}</span>
                                <span className="text-xs font-bold leading-tight sm:text-base" style={{ color: '#eab308' }}>{kickOffTime}</span>
                            </div>

                            {/* Countdown or result statistics icon */}
                            {countdown ? (
                                <div className="flex max-w-full flex-wrap items-center justify-center gap-0.5 px-0.5">
                                    <span className="text-center text-[8px] leading-tight text-gray-400 sm:text-[10px]">⏱ {countdown}</span>
                                </div>
                            ) : (
                                <div className="flex max-w-full flex-row flex-wrap items-center justify-center gap-1 px-0.5">
                                    <FaBasketball color="#000000" size={8} className="shrink-0" />
                                    <span className="text-center text-[6px] font-semibold leading-tight text-black/60 sm:text-[8px]">{t("resultStatistics")}</span>
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

                        {showVvvipFeaturedMarker && (
                            <div
                                className="pointer-events-none absolute bottom-1 right-1 z-10 flex items-center gap-px sm:gap-0.5 sm:bottom-1.5 sm:right-2"
                                title="VVVIP 精選場次"
                                aria-hidden
                            >
                                {[0, 1, 2].map((i) => (
                                    <FaFutbol
                                        key={i}
                                        className="h-3 w-3 shrink-0 text-neutral-900 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] sm:h-3.5 sm:w-3.5"
                                    />
                                ))}
                            </div>
                        )}
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
