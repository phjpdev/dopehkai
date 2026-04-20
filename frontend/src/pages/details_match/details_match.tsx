import AppBarComponent from "../../components/appBar";
import { Loading } from "../../components/loading";
import { useProbability } from "../../hooks/useProbality";
import { useMatchAnalysis } from "../../hooks/useMatchAnalysis";
import { useNavigate, useParams } from "react-router-dom";
import LastGameDetailsComponent from "./components/last_games_details";
import AppColors from "../../ultis/colors";
import AppAssets from "../../ultis/assets";
import ThemedText from "../../components/themedText";
import AppGlobal from "../../ultis/global";
import API from "../../api/api";
import { Probability } from "../../models/probability";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/userAuthStore";
import HeaderDetailsComponent from "./components/header_details";
import { getTeamNameInCurrentLanguage } from "../../ultis/languageUtils";
import LockedAnalysisCard from "./components/locked_analysis_card";
import GlobeAnimation from "../../components/globe_animation";
import PickCard, { LockedPickCard, formatPickLabel } from "./components/pick_card";


function DetailsMatchPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const { data, isLoading, error } = useProbability(id ?? "");
    const { data: analysisMap } = useMatchAnalysis();
    const [loadingGenerate, setLoadingGenerate] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [generatingPicks, setGeneratingPicks] = useState(false);
    const [picksAttempted, setPicksAttempted] = useState(false);
    const [isVip, setIsVip] = useState<boolean | null>(null);
    const [isVvip, setIsVvip] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const { userRole } = useAuthStore();

    useEffect(() => {
        if (!userRole) {
            navigate("/");
        } else {
            API.GET(AppGlobal.baseURL + "user/verify/vip")
                .then((res) => { setIsVip(res.status === 200); })
                .catch(() => { setIsVip(false); });
            API.GET(AppGlobal.baseURL + "user/verify/vvip")
                .then((res) => { setIsVvip(res.status === 200); })
                .catch(() => { setIsVvip(false); });
        }
    }, [userRole, navigate]);

    // Auto-generate ia when missing
    useEffect(() => {
        if (!data || hasGenerated || loadingGenerate || !id || data.ia) return;

        if (!data.predictions) {
            setLoadingGenerate(true);
            setHasGenerated(true);
            API.GET(AppGlobal.baseURL + "match/match-data/" + id + "?refresh=true")
                .then((refreshRes) => {
                    if (refreshRes.status === 200 && refreshRes.data) {
                        queryClient.setQueryData(['probability', id], refreshRes.data);
                        if (refreshRes.data.predictions && !refreshRes.data.ia) {
                            return API.GET(AppGlobal.baseURL + "match/match-analyze/" + id)
                                .then((analyzeRes) => {
                                    if (analyzeRes.status === 200 && analyzeRes.data) {
                                        queryClient.setQueryData(['probability', id], (oldData: Probability) => {
                                            if (!oldData) return oldData;
                                            return { ...oldData, ia: analyzeRes.data };
                                        });
                                    }
                                });
                        }
                    }
                })
                .catch(() => { setHasGenerated(false); })
                .finally(() => { setLoadingGenerate(false); });
        } else {
            setHasGenerated(true);
            setLoadingGenerate(true);
            API.GET(AppGlobal.baseURL + "match/match-analyze/" + id)
                .then((res) => {
                    if (res.status === 200 && res.data) {
                        queryClient.setQueryData(['probability', id], (oldData: Probability) => {
                            if (!oldData) return oldData;
                            return { ...oldData, ia: res.data };
                        });
                    }
                })
                .catch(() => { setHasGenerated(false); })
                .finally(() => { setLoadingGenerate(false); });
        }
    }, [data, hasGenerated, loadingGenerate, id, queryClient]);

    // Auto-fetch picks when ia exists but picks are missing or incomplete
    useEffect(() => {
        if (!data?.ia || picksAttempted || generatingPicks || !id) return;
        const p = data.ia.picks;
        if (p?.goals?.bestPick && p?.had?.bestPick && p?.handicap?.bestPick && p?.corners?.bestPick) return;

        setPicksAttempted(true);
        setGeneratingPicks(true);
        API.GET(AppGlobal.baseURL + "match/match-analyze/" + id)
            .then((res) => {
                if (res.status === 200 && res.data) {
                    queryClient.setQueryData(['probability', id], (oldData: Probability) => {
                        if (!oldData) return oldData;
                        return { ...oldData, ia: res.data };
                    });
                }
            })
            .catch((err) => {
                console.error('Error fetching picks:', err);
            })
            .finally(() => { setGeneratingPicks(false); });
    }, [data, picksAttempted, generatingPicks, id, queryClient]);

    async function generateIA() {
        if (loadingGenerate || hasGenerated || !id) return;
        setLoadingGenerate(true);
        setHasGenerated(true);
        setPicksAttempted(false);
        const res = await API.GET(AppGlobal.baseURL + "match/match-analyze/" + id);
        if (res.status === 200 && res.data) {
            queryClient.setQueryData(['probability', id], (oldData: Probability) => ({
                ...oldData,
                ia: res.data
            }));
            queryClient.invalidateQueries({ queryKey: ['probability', id] });
        }
        setLoadingGenerate(false);
    }

    // Use list analysis (batch) for home/away % (matches match list), but preserve picks from individual match
    const displayData: Probability | undefined =
        data && id
            ? {
                ...data,
                ia: analysisMap && analysisMap[id]
                    ? { ...analysisMap[id], picks: data.ia?.picks }
                    : data.ia
            }
            : data;

    return (
        error ?
            <Loading />
            : isLoading || !data
                ?
                <Loading />
                : <div className="overflow-x-hidden h-screen w-screen">

                    <div className="absolute inset-0 w-full h-full z-[-1]">
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none"
                            style={{
                                backgroundImage: `url(${AppAssets.background_image})`,
                                opacity: 1,
                            }}
                        ></div>
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: 'black',
                                opacity: 0.2,
                            }}
                        ></div>
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: AppColors.primary,
                                opacity: 0.1,
                            }}
                        ></div>
                        {/* Globe Animation */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                            <GlobeAnimation 
                                width="100%" 
                                height="100%" 
                                style={{ maxWidth: '800px', maxHeight: '800px' }}
                            />
                        </div>
                    </div>

                    <AppBarComponent />
                    <div className="mt-24" >
                        {displayData && <HeaderDetailsComponent data={displayData} showAnalysisLabel={isVip === true} />}

                        {/* Non-VIP: show all 4 pick types as locked */}
                        {isVip === false && (
                            <>
                                <LockedAnalysisCard kickOff={data.kickOff} />
                                <LockedAnalysisCard kickOff={data.kickOff} />
                                <LockedAnalysisCard kickOff={data.kickOff} />
                            </>
                        )}

                        {/* VIP or VVIP: show analysis cards */}
                        {isVip === true && (
                            !displayData?.ia && loadingGenerate ? (
                                <div style={{ marginTop: 30 }}>
                                    <div style={{ flexDirection: "row", display: "flex", width: "100%", marginTop: 10, marginBottom: 50, alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ width: "20%", height: 2, backgroundColor: AppColors.primary }} />
                                        <div style={{ width: 70, height: 70, backgroundColor: AppColors.primary, borderRadius: 20, justifyContent: "center", display: "flex", marginLeft: 40, marginRight: 40, alignItems: "center" }}>
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <div style={{ width: "20%", height: 2, backgroundColor: AppColors.primary }} />
                                    </div>
                                </div>
                            ) : !displayData?.ia ? (
                                <div style={{ marginTop: 30, cursor: "pointer" }} onClick={generateIA}>
                                    <div className="flex items-center justify-center">
                                        <div className="bg-white rounded-lg p-2 mt-2 flex-row flex items-center justify-center">
                                            <ThemedText className="font-bold text-[12px] sm:text-[16px] leading-tight" type="defaultSemiBold" style={{ color: AppColors.background }}>
                                                {t('generateStats')}
                                            </ThemedText>
                                        </div>
                                    </div>
                                    <div style={{ flexDirection: "row", display: "flex", width: "100%", marginTop: 10, marginBottom: 50, alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ width: "20%", height: 2, backgroundColor: AppColors.primary }} />
                                        <div style={{ width: 70, height: 70, backgroundColor: AppColors.primary, borderRadius: 20, justifyContent: "center", display: "flex", marginLeft: 40, marginRight: 40, alignItems: "center" }}>
                                            <img src={AppAssets.ia} className="w-8" style={{ filter: "brightness(0) invert(1)" }} />
                                        </div>
                                        <div style={{ width: "20%", height: 2, backgroundColor: AppColors.primary }} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 入球大細 — VIP and VVIP */}
                                    <PickCard
                                        typeLine1="入球"
                                        typeLine2="大細"
                                        bestPick={formatPickLabel("goals", displayData.ia?.picks?.goals?.bestPick ?? "—")}
                                        confidence={displayData.ia?.picks?.goals?.confidence ?? 0}
                                        loading={generatingPicks && !displayData.ia?.picks?.goals?.bestPick}
                                    />

                                    {/* 主客和 — VVIP only */}
                                    {isVvip === true ? (
                                        <PickCard
                                            typeLine1="主客"
                                            typeLine2="和"
                                            bestPick={formatPickLabel("had", displayData.ia?.picks?.had?.bestPick ?? "—")}
                                            confidence={displayData.ia?.picks?.had?.confidence ?? 0}
                                            loading={generatingPicks && !displayData.ia?.picks?.had?.bestPick}
                                        />
                                    ) : (
                                        <LockedPickCard typeLine1="主客" typeLine2="和" />
                                    )}

                                    {/* 讓球 — VVIP only */}
                                    {isVvip === true ? (
                                        <PickCard
                                            typeLine1="讓"
                                            typeLine2="球"
                                            bestPick={formatPickLabel("handicap", displayData.ia?.picks?.handicap?.bestPick ?? "—")}
                                            confidence={displayData.ia?.picks?.handicap?.confidence ?? 0}
                                            loading={generatingPicks && !displayData.ia?.picks?.handicap?.bestPick}
                                        />
                                    ) : (
                                        <LockedPickCard typeLine1="讓" typeLine2="球" />
                                    )}

                                    {/* 角球大細 — VVIP only */}
                                    {isVvip === true ? (
                                        <PickCard
                                            typeLine1="角球"
                                            typeLine2="大細"
                                            bestPick={formatPickLabel("corners", displayData.ia?.picks?.corners?.bestPick ?? "—")}
                                            confidence={displayData.ia?.picks?.corners?.confidence ?? 0}
                                            loading={generatingPicks && !displayData.ia?.picks?.corners?.bestPick}
                                        />
                                    ) : (
                                        <LockedPickCard typeLine1="角球" typeLine2="大細" />
                                    )}
                                </>
                            )
                        )}

                        {
                            //  <DetailsInfoComponent probability={data} />
                        }

                        {/* HKJC-only matches have no lastGames – show limited message instead of crashing */}
                        {data.lastGames?.homeTeam && data.lastGames?.awayTeam ? (
                            <>
                                <LastGameDetailsComponent name={getTeamNameInCurrentLanguage(data.homeLanguages, data.homeTeamName)} img={data.homeTeamLogo} lastGames={data.lastGames.homeTeam.recentMatch} />
                                <LastGameDetailsComponent name={getTeamNameInCurrentLanguage(data.awayLanguages, data.awayTeamName)} img={data.awayTeamLogo} lastGames={data.lastGames.awayTeam.recentMatch} />
                            </>
                        ) : (
                            <div className="mx-auto mt-8 p-4 max-w-md rounded-lg bg-white/10 text-center">
                                <ThemedText type="subtitle" className="text-white">
                                    {t('limitedMatchData') !== 'limitedMatchData' ? t('limitedMatchData') : 'Limited data for this match. Statistics and recent games are not available.'}
                                </ThemedText>
                            </div>
                        )}




                        {userRole && (userRole === "admin" || userRole === "subadmin") &&
                            <a
                                href={`/api/match/match-data/generate/${id}`}
                                className="sm:w-2/3 w-5/6 h-16 mt-5 mx-auto bg-black rounded-xl justify-center items-center flex text-white hover:text-white font-bold text-lg hover:bg-purple-600 transition"
                            >
                                {t('generate_excel')}
                            </a>
                        }



                        <div style={{ height: 30 }} />


                    </div>
                </div >

    );
}
export default DetailsMatchPage;

