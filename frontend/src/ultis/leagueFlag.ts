/** Maps HKJC tournament leagueCode to ISO 3166-1 alpha-2 country codes for flagcdn.com */
const codeToCountry: Record<string, string> = {
  EPL: "gb-eng",
  ED1: "gb-eng",
  ED2: "gb-eng",
  ISA: "it",
  IFC: "it",
  IB1: "it",
  FFL: "fr",
  FFA: "fr",
  SFL: "es",
  SF2: "es",
  SC1: "es",
  GFL: "de",
  GB1: "de",
  GSC: "de",
  BFL: "be",
  PFL: "pt",
  PFC: "pt",
  RPL: "ru",
  NWC: "no",
  SAL: "se",
  MXL: "mx",
  MXLW: "mx",
  APL: "ar",
  UD1: "uy",
  CD1: "cl",
  BDC: "br",
  BD1W: "br",
  AD1W: "au",
  KD1: "kr",
  KD1W: "kr",
  JV1: "jp",
  DF2: "nl",
  DFL: "nl",
  GD1W: "de",
  ED1W: "gb-eng",
  SFW: "es",
};

/**
 * Returns a flagcdn.com image URL for the given HKJC leagueCode.
 * Returns null for codes without a clear country mapping (e.g. ACL, AC2).
 */
export function getLeagueFlagUrl(leagueCode?: string): string | null {
  if (!leagueCode) return null;
  const country = codeToCountry[leagueCode.toUpperCase()];
  if (!country) return null;
  return `https://flagcdn.com/w20/${country}.png`;
}
