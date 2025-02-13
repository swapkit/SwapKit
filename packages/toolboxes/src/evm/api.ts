import {
  Chain,
  ChainToChainId,
  type EVMChain,
  RequestClient,
  SKConfig,
  formatBigIntToSafeValue,
  warnOnce,
} from "@swapkit/helpers";

async function getEthplorerBalance({ address }: { address: string }) {
  const apiKey = SKConfig.get("apiKeys").ethplorer || "freekey";

  const { tokens = [] } = await RequestClient.get<AddressInfo>(
    `https://api.ethplorer.io/getAddressInfo/${address}`,
    { searchParams: { apiKey } },
  );

  return tokens
    .filter(({ tokenInfo: { symbol }, rawBalance }) => symbol && rawBalance !== "0")
    .map(({ tokenInfo: { symbol, decimals, address: tokenAddress }, rawBalance }) => ({
      chain: Chain.Ethereum,
      decimal: Number.parseInt(decimals),
      symbol: tokenAddress ? `${symbol}-${tokenAddress}` : symbol,
      value: formatBigIntToSafeValue({
        value: BigInt(rawBalance),
        decimal: Number.parseInt(decimals),
        bigIntDecimal: Number.parseInt(decimals),
      }),
    }));
}

async function getCovalentBalance({ chain, address }: { chain: Chain; address: string }) {
  const apiKey = SKConfig.get("apiKeys").covalent;

  if (!apiKey) {
    warnOnce(true, "No covalent api key found. Use SKConfig.setApiKey('your-api-key')");
    return [];
  }

  const { data } = await RequestClient.get<{ data: CovalentBalanceResponse }>(
    `https://api.covalenthq.com/v1/${ChainToChainId[chain]}/address/${address}/balances_v2/`,
    { searchParams: { key: apiKey } },
  );

  return (data?.items || [])
    .filter(({ is_spam }) => !is_spam)
    .map(
      ({ balance, contract_decimals, contract_ticker_symbol, contract_address, native_token }) => ({
        value: formatBigIntToSafeValue({
          value: BigInt(balance),
          decimal: contract_decimals,
          bigIntDecimal: contract_decimals,
        }),
        decimal: contract_decimals,
        chain,
        symbol: `${contract_ticker_symbol || "Unknown"}${native_token ? "" : `-${contract_address}`}`,
      }),
    );
}

export function getEvmApi(chain: EVMChain) {
  const getBalance = chain === Chain.Ethereum ? getEthplorerBalance : getCovalentBalance;
  return { getBalance: (address: string) => getBalance({ address, chain }) };
}

export function createCustomEvmApi(methods: ReturnType<typeof getEvmApi>) {
  return methods;
}

type CovalentBalanceResponse = {
  address: string;
  updated_at: string;
  next_updated_at: string;
  quote_currency: string;
  items: {
    is_spam: boolean;
    contract_decimals: number;
    contract_name: string;
    contract_ticker_symbol: string;
    contract_address: string;
    logo_url: string;
    last_transferred_at: string;
    native_token: boolean;
    type: string;
    balance: number;
    balance_24h: number;
    quote_rate: number;
    quote_rate_24h: number;
    quote: number;
    quote_24h: number;
  }[];
};

type PriceInfo = {
  rate: number;
  diff: number;
  diff7d?: number;
  ts: number;
  marketCapUsd?: number;
  availableSupply?: number;
  volume24h?: number;
  diff30d?: number;
  volDiff1?: number;
  volDiff7?: number;
  volDiff30?: number;
  currency?: string;
};

type TokenInfo = {
  address: string;
  decimals: string;
  name: string;
  owner: string;
  symbol: string;
  totalSupply: string;
  lastUpdated: number;
  issuancesCount: number;
  holdersCount: number;
  image?: string;
  description?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  coingecko?: string;
  ethTransfersCount: number;
  price: boolean | PriceInfo | unknown;
  publicTags?: string[];
  txsCount?: number;
  transfersCount?: number;
};

type TokenBalance = {
  tokenInfo: TokenInfo;
  balance: number;
  rawBalance: string;
  totalIn?: number;
  totalOut?: number;
};

export type AddressInfo = {
  address: string;
  ETH: {
    balance: number;
    totalIn?: number;
    totalOut?: number;
    price: PriceInfo;
  };
  contractInfo?: {
    creatorAddress: string;
    transactionHash: string;
    timestamp: string;
  };
  tokenInfo?: TokenInfo;
  tokens?: TokenBalance[];
  countTxs: number;
};
