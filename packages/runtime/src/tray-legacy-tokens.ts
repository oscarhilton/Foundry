/** Anti-corruption layer: physical tray tokens → legacy chain-parser tokens. */

export type CompiledTrayToken = {
  physicalToken: string;
  parserToken: string;
  slotIndex: number;
};

const LEGACY_TOKEN_MAP: Record<string, string> = {
  "place/home": "identity/hallway",
  "place/work": "identity/hallway",
  "place/outside": "identity/hallway",
  "place/commute": "identity/hallway",
  "place/london": "identity/london",
  "source/weather": "identity/weather",
  "moment/morning": "moment/morning",
  "moment/afternoon": "moment/afternoon",
  "moment/evening": "moment/evening",
  "moment/night": "moment/night",
  "moment/now": "moment/now",
  "moment/later": "moment/later",
  "phenomenon/wind": "identity/weather",
  "phenomenon/rain": "identity/weather",
  "phenomenon/sun": "identity/weather",
  "phenomenon/snow": "identity/weather",
};

export function toLegacyParserToken(physicalToken: string): string {
  return LEGACY_TOKEN_MAP[physicalToken] ?? physicalToken;
}

export function compileTrayTokensForLegacyParser(
  activeFaceTokens: { token: string; slotIndex: number }[],
): CompiledTrayToken[] {
  return activeFaceTokens.map(({ token, slotIndex }) => ({
    physicalToken: token,
    parserToken: toLegacyParserToken(token),
    slotIndex,
  }));
}

export function isWeatherSourceToken(token: string): boolean {
  return (
    token === "source/weather" ||
    token === "identity/weather" ||
    token.startsWith("phenomenon/")
  );
}
