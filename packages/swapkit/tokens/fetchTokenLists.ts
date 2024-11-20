import { SwapKitApi } from "@swapkit/api";
import { Chain, ChainId, ProviderName } from "@swapkit/helpers";

function parseChain(chain: string) {
  if (chain === "ARBITRUM") return Chain.Arbitrum;
  return chain;
}

function parseIdentifier(identifier: string) {
  if (identifier.startsWith("ARBITRUM.")) {
    return identifier.replace("ARBITRUM.", `${Chain.Arbitrum}.`);
  }
  return identifier;
}

const providers = (await SwapKitApi.getTokenListProvidersV2(true)).filter(
  (provider) =>
    ![
      ProviderName.THORCHAIN_STREAMING,
      ProviderName.MAYACHAIN_STREAMING,
      ProviderName.OCISWAP_V1,
    ].includes(provider.provider),
);

console.info(providers);

console.info(
  `🚀 Fetching token lists from ${providers.length} providers:\n${providers
    .map(({ provider }) => provider)
    .join("\n-")}`,
);

const thorchainChainId = ChainId.THORChain;

for (const { provider } of providers) {
  try {
    const tokenList = await SwapKitApi.getTokenListV2(provider, true);
    if (!tokenList) continue;

    console.info(`✅ ${provider} token list fetched (${tokenList.tokens.length} tokens)`);

    const tokens = tokenList.tokens
      .map((token) => ({
        address: token.address,
        chain: parseChain(token.chain),
        // TODO remove after fork
        chainId: token.chainId === "thorchain-mainnet-v1" ? thorchainChainId : token.chainId,
        decimals: token.decimals,
        identifier: parseIdentifier(token.identifier),
        logoURI: token.logoURI,
        shortCode: token.shortCode,
        ticker: token.ticker,
      }))
      .sort((a, b) => a.identifier.localeCompare(b.identifier));

    const tokenListWithTokens = { ...tokenList, tokens };

    await Bun.write(
      `src/tokenLists/${provider.toLowerCase()}.ts`,
      `export const list = ${JSON.stringify(tokenListWithTokens, null, 2)} as const;`,
    );
  } catch (_error) {
    console.error(provider);
  }
}
