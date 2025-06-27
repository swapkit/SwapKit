export const TOKEN_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  USDT: "#26A17B",
  USDC: "#2775CA",
  BNB: "#F3BA2F",
  SOL: "#00FFA3",
  AVAX: "#E84142",
  MATIC: "#8247E5",
  ATOM: "#2E3148",
  DOT: "#E6007A",
  ADA: "#0033AD",
  LINK: "#2A5ADA",
  UNI: "#FF007A",
  LTC: "#BFBBBB",
  BCH: "#8DC351",
  ALGO: "#000000",
  FTM: "#1969FF",
  NEAR: "#00C1DE",
  VET: "#15BDFF",
  FLOW: "#00EF8B",
  ICP: "#29ABE2",
  APE: "#0054FD",
  SAND: "#00ADEF",
  MANA: "#FF2D55",
  RUNE: "#00CCFF",
  MAYA: "#00CCFF",
  THOR: "#00CCFF",
};

export const CHAIN_COLORS: Record<string, string> = {
  ETH: "#627EEA",
  BTC: "#F7931A",
  BSC: "#F3BA2F",
  AVAX: "#E84142",
  ARB: "#28A0F0",
  OP: "#FF0420",
  POLYGON: "#8247E5",
  MATIC: "#8247E5",
  BASE: "#0052FF",
  MAYA: "#00CCFF",
  THOR: "#00CCFF",
  THORCHAIN: "#00CCFF",
  GAIA: "#2E3148",
  KUJIRA: "#FF5561",
  DASH: "#008CE7",
  DOGE: "#C2A633",
  LTC: "#BFBBBB",
  BCH: "#8DC351",
  COSMOS: "#2E3148",
  ARBITRUM: "#28A0F0",
  OPTIMISM: "#FF0420",
  TRON: "#FF060A",
  SOLANA: "#00FFA3",
};

export function getTokenColor(symbol: string): string {
  return TOKEN_COLORS[symbol] || "#6B7280";
}

export function getChainColor(chain: string): string {
  return CHAIN_COLORS[chain.toUpperCase()] || "#627EEA";
}
