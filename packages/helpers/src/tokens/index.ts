import type { AssetValue } from "../modules/assetValue";
import * as tokenLists from "./lists";

const tokenIcons: Record<string, string> = {};

export function getTokenIcon(assetOrIdentifier: AssetValue | string): string | undefined {
  const identifier =
    typeof assetOrIdentifier === "string" ? assetOrIdentifier : assetOrIdentifier.toString();

  if (tokenIcons[identifier]) return tokenIcons[identifier];

  // Search through all lists for a matching token
  for (const list of Object.values(tokenLists)) {
    const token = list.tokens.find((token) => token.identifier === identifier);

    if (token?.logoURI) {
      tokenIcons[identifier] = token.logoURI;

      return token.logoURI;
    }
  }

  return undefined;
}

export { tokenLists };
