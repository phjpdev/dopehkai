import { useTranslation } from "react-i18next";
import type { Probability } from "../../../models/probability";
import ThemedText from "../../../components/themedText";
import AppAssets from "../../../ultis/assets";
import AppColors from "../../../ultis/colors";
import { getTeamNameInCurrentLanguage } from "../../../ultis/languageUtils";
import Crown from "../../../components/crown";

interface Props {
    probability: Probability;
    /** Less margin above first card (e.g. after 預測比分 panel). */
    tightStackTop?: boolean;
}

function formatStatWinRateShowing(override: string | undefined, fallbackBase: string | number): string {
    const fb = `${String(fallbackBase).replace(/%/g, "").trim()}%`;
    if (override == null) return fb;
    const o = override.trim();
    if (!o) return fb;
    return o.endsWith("%") ? o : `${o.replace(/%/g, "")}%`;
}

function DetailsCardComponent({
    probability,
    tightStackTop,
}: Props) {
    const { t } = useTranslation();
    const ae = probability.adminAnalysisEdits;

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

    const pillHome =
        typeof ae?.iaWinPctDisplay?.home === "number" && !Number.isNaN(ae.iaWinPctDisplay.home)
            ? ae.iaWinPctDisplay.home
            : homeWin;
    const pillAway =
        typeof ae?.iaWinPctDisplay?.away === "number" && !Number.isNaN(ae.iaWinPctDisplay.away)
            ? ae.iaWinPctDisplay.away
            : awayWin;

    const hasLastGames = !!probability.lastGames?.homeTeam && !!probability.lastGames?.awayTeam;

    let homeGoals = 0;
    let homeGoalsAway = 0;
    let homeWinRate: string | number = Math.round(homeWin);

    let awayGoals = 0;
    let awayGoalsAway = 0;
    let awayWinRate: string | number = Math.round(awayWin);

    if (hasLastGames) {
        const homeStats = probability.lastGames!.homeTeam;
        homeGoals = homeStats.teamGoalsFor ? parseInt(homeStats.teamGoalsFor) : 0;
        homeGoalsAway = homeStats.teamGoalsAway ? parseInt(homeStats.teamGoalsAway) : 0;
        const homeResults = homeStats.teamForm.split(",");
        const homeWinCount = homeResults.filter(r => r === "W").length;
        let homeWinRateCalculated = homeResults.length > 0 ? ((homeWinCount / homeResults.length) * 100) : 0;
        homeWinRate = homeWinRateCalculated === 0 ? Math.round(homeWin) : homeWinRateCalculated.toFixed(0);

        const awayStats = probability.lastGames!.awayTeam;
        awayGoals = awayStats.teamGoalsFor ? parseInt(awayStats.teamGoalsFor) : 0;
        awayGoalsAway = awayStats.teamGoalsAway ? parseInt(awayStats.teamGoalsAway) : 0;
        const awayResults = awayStats.teamForm.split(",");
        const awayWinCount = awayResults.filter(r => r === "W").length;
        let awayWinRateCalculated = awayResults.length > 0 ? ((awayWinCount / awayResults.length) * 100) : 0;
        awayWinRate = awayWinRateCalculated === 0 ? Math.round(awayWin) : awayWinRateCalculated.toFixed(0);
    }

    const homeStatShow = formatStatWinRateShowing(ae?.statsWinRateDisplay?.home, homeWinRate);
    const awayStatShow = formatStatWinRateShowing(ae?.statsWinRateDisplay?.away, awayWinRate);

    const topSpacer = tightStackTop ? "mt-2" : "mt-5";
    const winRateClass =
        "sm:text-4xl text-2xl min-h-[2.5rem] font-bold text-black text-center flex items-center justify-center";

    return (
        <div className="w-full flex justify-center items-center flex-col">
            <div className={`sm:w-2/3 w-5/6 flex flex-col h-48 bg-white rounded-lg ${topSpacer} items-center justify-center`}>

                <div className="flex items-start sm:w-2/3 w-5/6 mb-2">
                    <Card
                        name={getTeamNameInCurrentLanguage(probability.homeLanguages, probability.homeTeamName)}
                        img={probability.homeTeamLogo}
                        probility={pillHome}
                    />
                </div>

                <p className="sm:text-sm text-sm font-heading sm:h-4 h-4 font-bold text-black text-center">
                    {t("PER_GAME_STATISTIC")}
                </p>

                <div className="flex flex-row justify-evenly items-center w-3/4 h-14 mt-1">
                    <div >
                        <p className="sm:text-4xl text-2xl h-19 font-bold text-black text-center">
                            {homeGoals}
                        </p>
                        <p className="sm:text-[10px] h-1 text-xs font-bold text-black/50 text-center">
                            {t("GOALS/GAME")}
                        </p>
                    </div>
                    <div className="h-12 bg-black/50 w-[2px]" />
                    <div >
                        <p className="sm:text-4xl text-2xl h-19 font-bold text-black text-center">
                            {homeGoalsAway}
                        </p>
                        <p className="sm:text-[10px] h-1 text-xs font-bold text-black/50 text-center">
                            {t("CONCEDED/GOALS/GAME")}
                        </p>
                    </div>
                    <div className="h-12 bg-black/50 w-[2px]" />
                    <div >
                        <p className={winRateClass}>{homeStatShow}</p>
                        <p className="sm:text-[10px] h-1 text-xs font-bold text-black/50 text-center">
                            {t("WIN_RATE")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="sm:w-2/3 w-5/6 flex flex-col h-48 bg-white rounded-lg mt-5 items-center justify-center">

                <div className="flex items-start sm:w-2/3 w-5/6 mb-2">
                    <Card
                        name={getTeamNameInCurrentLanguage(probability.awayLanguages, probability.awayTeamName)}
                        img={probability.awayTeamLogo}
                        probility={pillAway}
                    />
                </div>

                <p className="sm:text-sm text-xs font-heading sm:h-4 h-4 font-bold text-black text-center">
                    {t("PER_GAME_STATISTIC")}
                </p>

                <div className="flex flex-row justify-evenly items-center w-3/4 h-14 mt-1">
                    <div >
                        <p className="sm:text-4xl text-2xl h-19 font-bold text-black text-center">
                            {awayGoals}
                        </p>
                        <p className="sm:text-[10px] h-1 text-xs font-bold text-black/50 text-center">
                            {t("GOALS/GAME")}
                        </p>
                    </div>
                    <div className="h-12 bg-black/50 w-[2px]" />
                    <div >
                        <p className="sm:text-4xl text-2xl h-19 font-bold text-black text-center">
                            {awayGoalsAway}
                        </p>
                        <p className="sm:text-[10px] h-1 text-xs font-bold text-black/50 text-center">
                            {t("CONCEDED/GOALS/GAME")}
                        </p>
                    </div>
                    <div className="h-12 bg-black/50 w-[2px]" />
                    <div >
                        <p className={winRateClass}>{awayStatShow}</p>
                        <p className="sm:text-[10px] h-1 text-xs font-bold text-black/50 text-center">
                            {t("WIN_RATE")}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}


interface PropsCard {
    img?: string;
    name: string;
    probility: number;
    condition?: string;
}

function Card({
    img,
    name,
    probility,
    condition,
}: PropsCard) {

    const showCondition = condition != null && condition.replace(".0", "").trim() !== "" && condition.replace(".0", "").trim() !== "0";

    return <div style={{ flexDirection: "row" }}>

        <div style={{ flexDirection: "row", display: "flex", alignItems: "center", justifyItems: "flex-start", width: "100%" }} >

            {
                img
                    ? <img src={img}
                        onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = AppAssets.logo;
                        }}
                        className="h-7 w-7 sm:h-10 sm:w-10 object-contain mr-2" />
                    : <></>
            }

            <ThemedText
                className="font-bold text-[19px] sm:text-[20px] leading-tight"
                type="defaultSemiBold"
                style={{
                    color: "black",
                }}
            >
                {`${name}`}
            </ThemedText>


            {
                showCondition
                    ? <ThemedText
                        className="font-bold text-[17px] sm:text-[17px] leading-tight pl-4"
                        type="defaultSemiBold"
                        style={{
                            color: "black",
                        }}
                    >
                        {`    ${condition!.replace(".0", "")}`}
                    </ThemedText> : undefined
            }

            <div className="w-12 h-10 rounded-lg flex ml-4"
                style={{ backgroundColor: AppColors.primary, alignItems: "center", justifyContent: "center", justifyItems: "center" }}>

                <ThemedText
                    className="font-bold text-[12px] sm:text-[18px] leading-tight"
                    type="defaultSemiBold"
                    style={{
                        color: "white",
                    }}
                >
                    {`${probility.toFixed(0)}%`}
                </ThemedText>

            </div>

            <div className="w-2.5 shrink-0" />

            {probility > 70 && <Crown winRate={probility} />}

        </div>
    </div>;
}

export default DetailsCardComponent;
