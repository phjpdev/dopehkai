import { TeamLanguages } from "./match";

export interface Probability {
  homeLanguages?: TeamLanguages;
  awayLanguages?: TeamLanguages;
  awayTeamId: number
  homeForm: string
  predictions?: Predictions
  awayTeamNameEn: string
  eventId: string
  condition: string
  kickOffDate: string
  competitionId: number
  subMarketName: any
  bestBetName: string
  kickOffTime: string
  awayForm: string
  fixture_id: number
  hadHomePct: string
  homeTeamLogo: string
  homeTeamNameEn: string
  competitionName: string
  lastGames: LastGames
  competitionIdNav: number
  outcomeName: string
  matchOutcome: string
  awayTeamLogo: string
  kickOff: string
  homeTeamId: number
  hadDrawPct: string
  countryName: any
  awayTeamName: string
  countryId: string
  homeTeamName: string
  awayTeamImgUrl: any
  kickOffDateLocal: string
  hadAwayPct: string
  ia?: ResultIA
  /** HiLo 大細 lines from HKJC TG/HIL pool, e.g. [{ line: "2.5", overPct, underPct }] */
  hiloLines?: { line: string; overPct: string; underPct: string }[]
  /** HKJC HIL pool main available line condition, e.g. "2.5" */
  hilMainLine?: string
}

export interface PickResult {
  bestPick: string;
  confidence: number;
}

export interface ResultIA {
  draw: number;
  home: number;
  away: number;
  /** Backward-compat goals pick, e.g. 'OVER_2.5'. */
  bestPick?: string;
  picks?: {
    goals?: PickResult;    // 入球大細
    had?: PickResult;      // 主客和
    handicap?: PickResult; // 讓球
    corners?: PickResult;  // 角球大細
  };
}

export interface Predictions {
  pbrAway: number
  kellyAway: number
  evAway: number
  pbrHome: number
  homeWinRate: number
  awayWinRate: number
  overRound: number
  kellyHome: number
  evHome: number
}

export interface LastGames {
  homeTeam: HomeTeam
  awayTeam: HomeTeam
}

export interface HomeTeam {
  nextMatch: NextMatch
  teamPlayed: string
  teamForm: string
  recentMatch: RecentMatch[]
  teamDraw: string
  teamGoalsFor: string
  teamGoalsAway: string
  teamLoss: string
  teamWin: string
}

export interface NextMatch {
  competitionName: string
  homeTeamName: string
  awayTeamName: string
  kickOff: string
}

export interface RecentMatch {
  score: string
  awayTeamName: string
  result: string
  competitionName: string
  kickOff: string
  homeTeamName: string
}

export interface AwayTeam {
  nextMatch: NextMatch2
  teamPlayed: string
  teamGoalsAway: string
  recentMatch: RecentMatch2[]
  teamGoalsFor: string
  teamWin: string
  teamDraw: string
  teamLoss: string
  teamForm: string
}

export interface NextMatch2 {
  competitionName: string
  awayTeamName: string
  kickOff: string
  homeTeamName: string
}

export interface RecentMatch2 {
  score: string
  kickOff: string
  homeTeamName: string
  competitionName: string
  result: string
  awayTeamName: string
}
