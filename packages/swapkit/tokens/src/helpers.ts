import { tokenLists as defaultTokenLists } from "./lists";
import type { TokenList } from "./types";

export function getTokenIcon(
  identifier: string,
  lists: Record<string, TokenList> = defaultTokenLists,
): string | undefined {
  // Search through all lists for a matching token
  for (const list of Object.values(lists)) {
    const token = list.tokens.find((token) => token.identifier === identifier);
    if (token?.logoURI) {
      return token.logoURI;
    }
  }

  return undefined;
}
