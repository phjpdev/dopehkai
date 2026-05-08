import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppBarCompoonent from "../../components/appBar";
import ThemedText from "../../components/themedText";
import AppColors from "../../ultis/colors";
import { useMatchs } from "../../hooks/userMatchs";
import { useMatchAnalysis } from "../../hooks/useMatchAnalysis";
import { Match } from "../../models/match";
import { Loading } from "../../components/loading";
import AppGlobal from "../../ultis/global";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/userAuthStore";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { CardMatch } from "../../components/card_match";
import AppAssets from "../../ultis/assets";
import { getTeamNameInCurrentLanguage } from "../../ultis/languageUtils";
import { featuredSetForDayMatches } from "../../ultis/vvvipFeaturedMatches";
import { useCanSeeVvvipFeaturedContent } from "../../hooks/useVvvipFeaturedMarkers";
import API from "../../api/api";
import { pastResultRowToMatch, type PastResultListRow } from "../../ultis/pastResultsToMatchList";
import { annotateMatchesWithAdminDailyEditable } from "../../ultis/adminDailyEditableMatches";


function MatchsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [days, setDays] = useState<string[]>([]);
    const [matchs, setMatchs] = useState<Match[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>();
    const { userRole } = useAuthStore();
    const canSeeVvvipFeatured = useCanSeeVvvipFeaturedContent();

    const { data, error, refetch, isPending, isError } = useMatchs();
    const { data: analysisMap } = useMatchAnalysis();

    const isStaffList = userRole === "admin" || userRole === "subadmin";

    const { data: pastTwoDaysPayload } = useQuery({
        queryKey: ["adminPastTwoDaysForMatchList", "skipGemini"],
        queryFn: async () => {
            const res = await API.GET(
                `${AppGlobal.baseURL}match/past-results?skipGemini=true`,
                {},
                60000
            );
            if (res.status !== 200) {
                return { matches: [] as PastResultListRow[] };
            }
            return res.data as { matches: PastResultListRow[] };
        },
        enabled: isStaffList,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const mergedForList = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return [] as Match[];
        }
        let base = [...data] as Match[];
        const pastRows = pastTwoDaysPayload?.matches ?? [];
        if (isStaffList && pastRows.length > 0) {
            const seen = new Set(base.map((m) => String(m.id || (m as any).eventId)));
            for (const row of pastRows) {
                const id = String(row.id);
                if (!seen.has(id)) {
                    seen.add(id);
                    base.push(pastResultRowToMatch(row));
                }
            }
        }
        const withIa = base.map((m: Match) => {
            const id = m.id || (m as any).eventId;
            const ia = id && analysisMap?.[id] ? analysisMap[id] : m.ia;
            return { ...m, ia };
        });
        // Past fixtures merged above were never annotated on the server; re-run the same
        // deterministic daily pair logic on the full list for staff workflows.
        annotateMatchesWithAdminDailyEditable(withIa);
        return withIa;
    }, [data, analysisMap, isStaffList, pastTwoDaysPayload?.matches]);

    useEffect(() => {
        if (!mergedForList.length) {
            setDays([]);
            return;
        }
        setDays(getDates(mergedForList));
    }, [mergedForList]);

    useEffect(() => {
        if (!mergedForList.length) {
            setMatchs([]);
            return;
        }
        getMatch(mergedForList);
    }, [mergedForList, selectedDay]);

    // When returning from details page, scroll back to the last clicked match
    useEffect(() => {
        try {
            const lastFrom = sessionStorage.getItem("lastMatchFrom");
            const lastId = sessionStorage.getItem("lastMatchId");
            if (!lastId || lastFrom !== "/matches") return;

            const target = matchs.find((m) => {
                const matchId = m.id || (m as any).eventId;
                return String(matchId) === String(lastId);
            });
            if (!target) return;

            // Ensure the correct day filter is selected so the match is rendered
            if (target.matchDateFormated) {
                setSelectedDay(target.matchDateFormated);
            }

            // Scroll after the DOM updates – keep one match above (clicked match appears second)
            setTimeout(() => {
                const el = document.getElementById(`match-${lastId}`);
                if (el) {
                    const scrollTarget = (el.previousElementSibling as HTMLElement) || el;
                    scrollTarget.scrollIntoView({ block: "start", behavior: "auto" });
                }
            }, 0);

            sessionStorage.removeItem("lastMatchFrom");
            sessionStorage.removeItem("lastMatchId");
        } catch {
            // ignore storage/DOM errors
        }
    }, [matchs]);

    const featuredForSelectedDay = useMemo(() => {
        if (!selectedDay || !matchs.length) return new Set<string>();
        const dayMatches = matchs.filter((x) => x.matchDateFormated === selectedDay);
        return featuredSetForDayMatches(dayMatches);
    }, [matchs, selectedDay]);

    const featuredSetsByDayLabel = useMemo(() => {
        const map = new Map<string, Set<string>>();
        if (!matchs.length) return map;
        const labels = [...new Set(matchs.map((m) => m.matchDateFormated).filter(Boolean))] as string[];
        for (const d of labels) {
            const dayMatches = matchs.filter((x) => x.matchDateFormated === d);
            map.set(d, featuredSetForDayMatches(dayMatches));
        }
        return map;
    }, [matchs]);

    function getMatch(matches: Match[]) {
        // Like 111 project: backend already filters past matches, so we just format dates
        // No additional filtering needed on frontend
        const allMatch: Match[] = matches
            .filter((m) => {
                // Only filter out matches with invalid kickOff dates
                if (!m.kickOff) return false;
                try {
                    // Handle both "YYYY-MM-DD HH:mm" and ISO format "YYYY-MM-DDTHH:mm:ss..."
                    let kickOffMoment: moment.Moment;
                    if (m.kickOff.includes('T')) {
                        // ISO format: "2026-01-30T00:00:00.000+08:00"
                        kickOffMoment = moment(m.kickOff);
                    } else {
                        // Format: "2026-01-30 01:30"
                        kickOffMoment = moment(m.kickOff, 'YYYY-MM-DD HH:mm');
                    }
                    
                    if (!kickOffMoment.isValid()) {
                        console.warn('Invalid kickOff date:', m.kickOff);
                        return false;
                    }
                    return true;
                } catch (error) {
                    console.warn('Error parsing kickOff date:', m.kickOff, error);
                    return false;
                }
            })
            .map((m) => {
                // Extract date part - handle both formats
                let dateStr: string;
                if (m.kickOff.includes('T')) {
                    // ISO format: "2026-01-30T00:00:00.000+08:00" -> "2026-01-30"
                    dateStr = m.kickOff.split('T')[0];
                } else {
                    // Format: "2026-01-30 01:30" -> "2026-01-30"
                    dateStr = m.kickOff.split(' ')[0];
                }
                
                const [_, month, day] = dateStr.split('-');
                const formatted = `${day}/${month}`;
                // Always set matchDateFormated for all matches
                m.matchDateFormated = formatted;
                return m;
            });
        setMatchs(allMatch);
    }


    function getDates(match: Match[]) {
        if (!match || match.length === 0) {
            console.log('[MatchsPage] getDates: No matches provided');
            return [];
        }
        
        const datasOrden = match
            .map(item => {
                if (!item.kickOff) return null;
                // Handle both "YYYY-MM-DD HH:mm" and ISO format "YYYY-MM-DDTHH:mm:ss..."
                if (item.kickOff.includes('T')) {
                    // ISO format: "2026-01-30T00:00:00.000+08:00" -> "2026-01-30"
                    return item.kickOff.split('T')[0];
                } else {
                    // Format: "2026-01-30 01:30" -> "2026-01-30"
                    return item.kickOff.split(' ')[0];
                }
            })
            .filter((date): date is string => date !== null && date !== undefined)
            .sort((a, b) => {
                // Sort dates in ascending order (oldest first)
                return a.localeCompare(b);
            });
        
        console.log('[MatchsPage] getDates: Raw dates extracted:', datasOrden);
        
        const datasUnicas: string[] = [];
        for (const dataStr of datasOrden) {
            const parts = dataStr.split('-');
            if (parts.length !== 3) {
                console.warn('[MatchsPage] getDates: Invalid date format:', dataStr);
                continue;
            }
            const [, mes, dia] = parts; // year not needed for display
            const formatada = `${dia}/${mes}`;
            if (!datasUnicas.includes(formatada)) {
                datasUnicas.push(formatada);
            }
        }
        
        console.log('[MatchsPage] getDates: Formatted unique dates:', datasUnicas);
        // Return dates in ascending order (earliest first)
        return datasUnicas;
    }

    const errMsg =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : t("matchesLoadFailed") !== "matchesLoadFailed"
                ? t("matchesLoadFailed")
                : "Could not load fixtures. Check that the API is reachable.";

    return (
        isError ? (
                <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-black px-6 pt-24 text-center">
                    <div
                        className="mb-10 h-40 w-40 bg-contain bg-center bg-no-repeat sm:h-52 sm:w-52"
                        style={{ backgroundImage: `url(${AppAssets.logo})` }}
                        aria-hidden
                    />
                    <ThemedText type="subtitle" className="mb-4 max-w-md text-white text-base leading-snug">
                        {errMsg}
                    </ThemedText>
                    <p className="mb-10 max-w-md text-sm leading-relaxed text-white/65">
                        {t("matchesLoadHint") !== "matchesLoadHint"
                            ? t("matchesLoadHint")
                            : <>Expected API base URL: <code className="text-white/90">{AppGlobal.baseURL}</code>. Start the backend (e.g. port 4000) and reload.</>}
                    </p>
                    <button
                        type="button"
                        className="rounded-xl bg-[#eab308] px-8 py-3 font-semibold text-black hover:opacity-90 active:opacity-80"
                        onClick={() => void refetch()}
                    >
                        {t("retry") !== "retry" ? t("retry") : "Retry"}
                    </button>
                </div>
            )
            : isPending
                ?
                <Loading />
                : <div className="relative flex h-[100dvh] w-full max-w-full flex-col overflow-hidden">

                    <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
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
                    </div>

                    <AppBarCompoonent />

                    <div
                        className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                    <div className="flex w-full min-w-0 flex-col items-center pb-6 pt-20">
                        <div
                            className="mx-auto mt-5 w-11/12 rounded-lg bg-white p-2 shadow-lg sm:w-3/5 sm:p-2.5"
                            style={{ backgroundColor: "white" }}
                        >
                            <div className="flex w-full flex-wrap items-stretch justify-center gap-1.5 sm:gap-2">
                                <div
                                    onClick={() => setSelectedDay(undefined)}
                                    style={{
                                        backgroundColor: !selectedDay ? AppColors.primary : "white",
                                        border: !selectedDay ? "none" : "2px solid #e5e7eb",
                                    }}
                                    className={`flex min-h-9 cursor-pointer items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-transform hover:scale-[1.02] sm:px-3 sm:text-xs ${
                                        !selectedDay
                                            ? "text-white shadow-sm"
                                            : "text-black hover:bg-gray-50 hover:border-gray-300"
                                    }`}
                                >
                                    <ThemedText
                                        type="subtitle"
                                        className={`text-center text-[11px] leading-tight sm:text-xs ${!selectedDay ? "text-white" : "text-black"}`}
                                        colorText={!selectedDay ? "white" : "black"}
                                    >
                                        {t("all")}
                                    </ThemedText>
                                    <svg
                                        className={`h-3 w-3 shrink-0 ${!selectedDay ? "text-white" : "text-black"}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>

                                {days.map((day, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedDay(day)}
                                        style={{
                                            backgroundColor: selectedDay === day ? AppColors.primary : "white",
                                            border: selectedDay === day ? "none" : "2px solid #e5e7eb",
                                        }}
                                        className={`flex min-h-9 cursor-pointer items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-transform hover:scale-[1.02] sm:px-3 sm:text-xs ${
                                            selectedDay === day
                                                ? "text-white shadow-sm"
                                                : "text-black hover:bg-gray-50 hover:border-gray-300"
                                        }`}
                                    >
                                        <ThemedText
                                            type="title"
                                            className={`text-center font-body text-[11px] leading-tight sm:text-xs ${selectedDay === day ? "text-white" : "text-black"}`}
                                            colorText={selectedDay === day ? "white" : "black"}
                                        >
                                            {day}
                                        </ThemedText>
                                        <svg
                                            className={`h-3 w-3 shrink-0 ${selectedDay === day ? "text-white" : "text-black"}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>



                    {
                        selectedDay
                            ? <div style={{ marginTop: 20 }}>
                                {matchs && matchs.length > 0 ? (
                                    matchs
                                        .filter((x) => x.matchDateFormated === selectedDay)
                                        .sort((a, b) => {
                                            // Handle both "YYYY-MM-DD HH:mm" and ISO format
                                            const momentA = a.kickOff.includes('T') 
                                                ? moment(a.kickOff) 
                                                : moment(a.kickOff, 'YYYY-MM-DD HH:mm');
                                            const momentB = b.kickOff.includes('T') 
                                                ? moment(b.kickOff) 
                                                : moment(b.kickOff, 'YYYY-MM-DD HH:mm');
                                            return momentA.valueOf() - momentB.valueOf();
                                        })
                                        .map((m) => {
                                            const matchId = m.id || (m as any).eventId;
                                            if (!matchId) {
                                                console.warn('Match missing id:', m);
                                                return null;
                                            }
                                            return (
                                                <div key={matchId} id={`match-${matchId}`} className="pt-1.5 sm:w-3/5 w-11/12 mx-auto">
                                                    <CardMatch
                                                        widht={"100%"}
                                                        id={matchId}
                                                        crownPosition="cardTopRight"
                                                        showFormBadges={isStaffList}
                                                        navigate={navigate}
                                                        match={m}
                                                        teams={[getTeamNameInCurrentLanguage(m.homeLanguages, m.homeTeamName), getTeamNameInCurrentLanguage(m.awayLanguages, m.awayTeamName)]}
                                                        showVvvipFeaturedMarker={canSeeVvvipFeatured && featuredForSelectedDay.has(String(matchId))}
                                                    />
                                                </div>
                                            );
                                        })
                                        .filter(Boolean)
                                ) : (
                                    <div className="text-center text-white mt-10">
                                        <ThemedText type="subtitle" className="text-lg">
                                            {t('noMatchesFound') || 'No matches found for this date'}
                                        </ThemedText>
                                    </div>
                                )}
                            </div>
                            : days && days.length > 0 ? days.map((d) => {
                                return <div key={d}>
                                    <div className="mx-auto mb-6 mt-8 flex w-11/12 items-start sm:w-3/5">

                                        <div className="flex w-full min-w-0 items-start">
                                            <div className="w-1 bg-black mr-2 self-stretch" />
                                            <div className="flex flex-col justify-center space-y-2 text-white">
                                                <p className="sm:text-2xl text-base sm:h-7 h-6 font-bold">
                                                    {d}
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    {matchs && matchs.length > 0 ? (
                                        matchs
                                            .filter((x) => x.matchDateFormated === d)
                                            .sort((a, b) => {
                                                // Handle both "YYYY-MM-DD HH:mm" and ISO format
                                                const momentA = a.kickOff.includes('T') 
                                                    ? moment(a.kickOff) 
                                                    : moment(a.kickOff, 'YYYY-MM-DD HH:mm');
                                                const momentB = b.kickOff.includes('T') 
                                                    ? moment(b.kickOff) 
                                                    : moment(b.kickOff, 'YYYY-MM-DD HH:mm');
                                                return momentA.valueOf() - momentB.valueOf();
                                            })
                                            .map((m) => {
                                                const matchId = m.id || (m as any).eventId;
                                                if (!matchId) {
                                                    console.warn('Match missing id:', m);
                                                    return null;
                                                }
                                                return (
                                                    <div key={matchId} id={`match-${matchId}`} className="pt-1.5 sm:w-3/5 w-11/12 mx-auto">
                                                        <CardMatch
                                                            widht={"100%"}
                                                            id={matchId}
                                                            crownPosition="cardTopRight"
                                                            showFormBadges={isStaffList}
                                                            navigate={navigate}
                                                            match={m}
                                                            teams={[getTeamNameInCurrentLanguage(m.homeLanguages, m.homeTeamName), getTeamNameInCurrentLanguage(m.awayLanguages, m.awayTeamName)]}
                                                            showVvvipFeaturedMarker={canSeeVvvipFeatured && (featuredSetsByDayLabel.get(d)?.has(String(matchId)) ?? false)}
                                                        />
                                                    </div>
                                                );
                                            })
                                            .filter(Boolean)
                                    ) : null}


                                </div>
                            }) : (
                                <div className="text-center text-white mt-10">
                                    <ThemedText type="subtitle" className="text-lg">
                                        {t('noMatchesFound') || 'No matches available'}
                                    </ThemedText>
                                </div>
                            )
                    }


                    {userRole && (userRole === "admin" || userRole === "subadmin") &&
                        <a
                            href={`/api/match/match-data/all/generate`}
                            className="sm:w-1/3 w-5/6 h-10 mt-5 mb-5 mx-auto bg-black rounded-xl justify-center items-center flex text-white hover:text-white font-bold text-lg hover:bg-purple-600 transition"
                        >
                            {t('generate_excel')}
                        </a>
                    }

                    </div>
                </div>




    );
}
export default MatchsPage

