export type Token = {
  address?: string;
  chain: string;
  chainId: string;
  decimals?: number;
  identifier: string;
  logoURL?: string;
  ticker: string;
  tokenlist: string;
};

export type TokensResponse = {
  keywords: string[];
  name: string;
  timestamp: string;
  version: { major: number; minor: number; patch: number };
  tokens: Token[];
};
