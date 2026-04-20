import { Match, ResultIA } from "../model/match.model";
import { generateText, getModelName, getProviderName } from "./aiProvider";

export async function IaProbality(match: Match, playersInjured: any): Promise<ResultIA | null> {
  try {
    const homeFormArr = (match.homeForm ?? "").split(",").filter(Boolean);
    const awayFormArr = (match.awayForm ?? "").split(",").filter(Boolean);
    const matchDataInput = {
      data: match.kickOff.split(" ")[0],
      home: {
        name: match.homeTeamNameEn || match.homeTeamName,
        last5Matches: homeFormArr.slice(0, 5),
        averageGoals: match.lastGames
          ? Number(match.lastGames.homeTeam.teamGoalsFor) / Number(match.lastGames.homeTeam.teamPlayed)
          : null,
        winRate: match.lastGames
          ? (Number(match.lastGames.homeTeam.teamWin) / Number(match.lastGames.homeTeam.teamPlayed)) * 100
          : null,
      },
      away: {
        name: match.awayTeamNameEn || match.awayTeamName,
        last5Matches: awayFormArr.slice(0, 5),
        averageGoals: match.lastGames
          ? Number(match.lastGames.awayTeam.teamGoalsFor) / Number(match.lastGames.awayTeam.teamPlayed)
          : null,
        winRate: match.lastGames
          ? (Number(match.lastGames.awayTeam.teamWin) / Number(match.lastGames.awayTeam.teamPlayed)) * 100
          : null,
      },
    };
    const injuredHome = playersInjured.home.length;
    const injuredAway = playersInjured.away.length;

    const hadHome = match.hadHomePct ?? match.predictions?.homeWinRate;
    const hadAway = match.hadAwayPct ?? match.predictions?.awayWinRate;
    const hadDraw = match.hadDrawPct;
    const hkjc1x2 =
      hadHome != null && hadAway != null
        ? `HKJC 1X2 (real-time implied %): Home ${hadHome}%, Draw ${hadDraw ?? "—"}%, Away ${hadAway}%.`
        : "";
    const hkjcHandicap = match.condition ? `HKJC Handicap: ${match.condition}.` : "";
    const hkjcHilo =
      match.hiloLines?.length
        ? "HKJC HiLo: " +
          match.hiloLines.map((l) => `${l.line} — Over ${l.overPct}%, Under ${l.underPct}%`).join("; ") +
          "."
        : "";
    const hkjcBlock = [hkjc1x2, hkjcHandicap, hkjcHilo].filter(Boolean).join(" ");

    const prompt = `You are a professional football analyst. Analyze the following match and provide predictions for 4 betting markets.

Match data:
- Date: ${matchDataInput.data}
- Home team: ${matchDataInput.home.name}
  - Last 5 matches: ${matchDataInput.home.last5Matches.join(", ")}
  - Average goals scored: ${matchDataInput.home.averageGoals?.toFixed(2) ?? "N/A"}
  - Win rate: ${matchDataInput.home.winRate ? matchDataInput.home.winRate.toFixed(1) + "%" : "N/A"}
  - Injured players: ${injuredHome}
- Away team: ${matchDataInput.away.name}
  - Last 5 matches: ${matchDataInput.away.last5Matches.join(", ")}
  - Average goals scored: ${matchDataInput.away.averageGoals?.toFixed(2) ?? "N/A"}
  - Win rate: ${matchDataInput.away.winRate ? matchDataInput.away.winRate.toFixed(1) + "%" : "N/A"}
  - Injured players: ${injuredAway}
${hkjcBlock ? `\nReference data (for context only, do NOT base predictions on odds): ${hkjcBlock}\n` : ""}

Rules:
- Base analysis on team form, strength, injuries, and home/away factors — NOT on odds
- goals.bestPick MUST be exactly one of: "OVER_2.5", "UNDER_2.5", "OVER_3.5", "UNDER_3.5", "OVER_4.5", "UNDER_4.5"
- had.bestPick MUST be exactly one of: "HOME", "DRAW", "AWAY"
- handicap.bestPick MUST be exactly one of: "HOME_-0.5", "HOME_-1", "HOME_-1.5", "AWAY_+0.5", "AWAY_+1", "AWAY_+1.5", "LEVEL"
- corners.bestPick MUST be exactly one of: "OVER_8.5", "UNDER_8.5", "OVER_9.5", "UNDER_9.5", "OVER_10.5", "UNDER_10.5"
- confidence: integer between 55 and 90 representing prediction confidence

Respond ONLY with this JSON (no markdown, no extra text):
{"home":number,"away":number,"draw":number,"picks":{"goals":{"bestPick":"OVER_2.5","confidence":70},"had":{"bestPick":"HOME","confidence":65},"handicap":{"bestPick":"HOME_-0.5","confidence":60},"corners":{"bestPick":"OVER_9.5","confidence":65}}}

Replace the example values with your actual analysis. home+away+draw must equal 100.`;

    const provider = getProviderName();
    const model = getModelName();
    console.log(`[${provider}] Calling single-match API`, { model, matchId: match.id || match.eventId, home: matchDataInput.home.name, away: matchDataInput.away.name });
    const content = await generateText(prompt, {
      systemInstruction: "You are a professional football analyst. You must respond ONLY with a single valid JSON object. No markdown, no code blocks, no explanation. Just the raw JSON.",
      temperature: 0.2,
    });
    console.log(`[${provider}] Raw response:`, content);

    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("IaProbality: No JSON found in response");
      return null;
    }
    const jsonString = content.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    console.log(`[${provider}] Parsed result:`, JSON.stringify(parsed));

    if (
      typeof parsed.home !== "number" ||
      typeof parsed.away !== "number" ||
      typeof parsed.draw !== "number"
    ) {
      console.error("IaProbality: Missing home/away/draw numbers");
      return null;
    }

    const extractPick = (raw: any) => {
      if (!raw || typeof raw.bestPick !== "string" || !raw.bestPick) return undefined;
      return {
        bestPick: raw.bestPick,
        confidence: typeof raw.confidence === "number" ? Math.min(95, Math.max(50, raw.confidence)) : 65,
      };
    };

    const picksRaw =
      parsed.picks && typeof parsed.picks === "object"
        ? {
            goals: extractPick(parsed.picks.goals),
            had: extractPick(parsed.picks.had),
            handicap: extractPick(parsed.picks.handicap),
            corners: extractPick(parsed.picks.corners),
          }
        : undefined;

    const hasCompletePicks =
      picksRaw?.goals && picksRaw?.had && picksRaw?.handicap && picksRaw?.corners;
    const hasAnyPick =
      !!picksRaw &&
      !!(picksRaw.goals || picksRaw.had || picksRaw.handicap || picksRaw.corners);

    if (picksRaw && !hasCompletePicks) {
      console.warn("IaProbality: picks incomplete:", JSON.stringify(picksRaw));
    }

    let picksPartial: ResultIA["picks"] | undefined;
    if (picksRaw && hasAnyPick) {
      picksPartial = {};
      if (picksRaw.goals) picksPartial.goals = picksRaw.goals;
      if (picksRaw.had) picksPartial.had = picksRaw.had;
      if (picksRaw.handicap) picksPartial.handicap = picksRaw.handicap;
      if (picksRaw.corners) picksPartial.corners = picksRaw.corners;
    }

    const result: ResultIA = {
      home: parsed.home,
      away: parsed.away,
      draw: parsed.draw,
      bestPick: picksRaw?.goals?.bestPick ?? (typeof parsed.bestPick === "string" ? parsed.bestPick : undefined),
      picks: picksPartial,
    };

    return result;
  } catch (error: any) {
    console.error("IaProbality error:", error.message || error);
    return null;
  }
}
