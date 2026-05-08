/**
 * HKJC GraphQL exposes `homeTeam.id` / `awayTeam.id`. The bet site serves crest assets from contents.hkjc.com.
 * If a URL 404s, CardMatch / fetchLogosForList fall back to FootyLogic or default logo.
 */
export function hkjcTeamLogoFromTeamId(teamId: string | undefined | null): string | undefined {
    if (!teamId || typeof teamId !== "string") return undefined;
    const id = teamId.trim();
    if (!id) return undefined;
    return `https://contents.hkjc.com/chinese/images/Teams/${encodeURIComponent(id)}.png`;
}
