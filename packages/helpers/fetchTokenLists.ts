import { Chain, ProviderName } from "./src";
import { SwapKitApi } from "./src/api";

const providers = (await SwapKitApi.getTokenListProviders()).filter(
  (provider) =>
    ![
      ProviderName.CHAINFLIP_STREAMING,
      ProviderName.THORCHAIN_STREAMING,
      ProviderName.MAYACHAIN_STREAMING,
      ProviderName.OCISWAP_V1,
    ].includes(provider.provider),
);

console.info(
  `🚀 Fetching token lists from ${providers.length} providers:\n${providers
    .map(({ provider, count }) => ` ${provider}: ${count} tokens`)
    .join("\n-")}`,
);

for (const { provider } of providers) {
  try {
    console.info(`🔄 Fetching token list for ${provider}...`);
    const tokenList = await SwapKitApi.getTokenList(provider);
    if (!tokenList) continue;

    console.info(`✅ ${provider} token list fetched (${tokenList.tokens.length} tokens)`);

    const tokens = tokenList.tokens
      .map((token) => ({
        address: token.address,
        chain: parseChain(token.chain),
        chainId: token.chainId,
        decimals: token.decimals,
        identifier: parseIdentifier(token.identifier),
        logoURI: token.logoURI,
        shortCode: token.shortCode,
        ticker: token.ticker,
      }))
      .sort((a, b) => a.identifier.localeCompare(b.identifier));

    const tokenListWithTokens = { ...tokenList, tokens };

    await Bun.write(
      `src/tokens/lists/${provider.toLowerCase()}.ts`,
      `export const list = ${JSON.stringify(tokenListWithTokens, null, 2)} as const;`,
    );
  } catch (error) {
    console.error(provider, error);
  }
}

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
