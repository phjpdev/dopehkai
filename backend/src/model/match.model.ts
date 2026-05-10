import { LastGameData } from "./footylogic_last_games"

export interface TeamLanguages {
    en: string;
    zh: string;
    zhCN: string;
}

export interface Match {
    id?: string;
    homeLanguages?: TeamLanguages;
    awayLanguages?: TeamLanguages;
    condition?: string
    kickOffTime: string
    kickOffDate: string
    competitionId: number
    eventId: string
    /** FootyLogic / list: 1X2 result label */
    outcomeName?: string
    matchOutcome: string
    homeForm: string
    awayForm: string
    competitionName: string
    homeTeamName: string
    kickOff: string
    awayTeamName: string
    kickOffDateLocal: string
    homeTeamNameEn?: string
    awayTeamNameEn?: string
    homeTeamLogo?: string
    awayTeamLogo?: string
    homeTeamId?: number
    awayTeamId?: number
    lastGames?: LastGameData
    fixture_id?: number
    league_id?: number,
    predictions?: Predictions
    ia?: ResultIA
    ia2?: ResultIA
    /** HKJC real-time: 1X2 implied % (主客和). */
    hadHomePct?: string
    hadDrawPct?: string
    hadAwayPct?: string
    /** HKJC tournament code e.g. "D2", "ACL", "CL" */
    leagueCode?: string
    /** HKJC tournament nameProfileId used to build flag image URL */
    leagueNameProfileId?: string
    /** HKJC HiLo lines e.g. [{ line: "2.5", overPct, underPct }]. */
    hiloLines?: { line: string; overPct: string; underPct: string }[]
    /** HKJC HIL pool main available line condition, e.g. "2.5" */
    hilMainLine?: string
    /** "pending" | "completed" – used for batch Gemini workflow */
    analysis_status?: "pending" | "completed"
    /** When AI analysis was last updated; used for stale check (e.g. re-analyze after 1h) */
    analysis_updated_at?: Date | string | null
    /** Admin-only overrides for analysis display strings and headline win % tiles (see PATCH /match/admin-analysis). */
    adminAnalysisEdits?: AdminAnalysisEdits
    /** Present on list/detail JSON: matches the deterministic HK-daily editable pair */
    adminDailyEditableAnalysis?: boolean
}

/** Optional display overrides merged by admins for the two daily-editable fixtures. */
export interface AdminAnalysisEdits {
    pickDisplay?: Partial<{
        goals: string;
        had: string;
        handicap: string;
        corners: string;
    }>;
    pickConfidenceDisplay?: Partial<{
        goals: number;
        had: number;
        handicap: number;
        corners: number;
    }>;
    iaWinPctDisplay?: Partial<{ home: number; away: number }>;
    statsWinRateDisplay?: Partial<{ home: string; away: string }>;
    predictedScoreDisplay?: Partial<{
        row1Home: number;
        row1Away: number;
        row2Home: number;
        row2Away: number;
    }>;
}

export interface PickResult {
    bestPick: string;
    confidence: number;
}

export interface ResultIA {
    draw: number;
    home: number;
    away: number;
    /** Backward-compat goals over/under pick, e.g. 'OVER_2.5'. */
    bestPick?: string;
    picks?: {
        goals?: PickResult;    // 入球大細
        had?: PickResult;      // 主客和
        handicap?: PickResult; // 讓球
        corners?: PickResult;  // 角球大細
    };
}

export interface Predictions {
    homeWinRate: number;
    awayWinRate: number;
    overRound: number;
    evHome: number;
    evAway: number;
    pbrHome: number;
    pbrAway: number;
    kellyHome: number;
    kellyAway: number;
}
