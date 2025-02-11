import * as tokenLists from "./tokenLists";

export function getTokenIcon(identifier: string): string | undefined {
  // Search through all lists for a matching token
  for (const list of Object.values(tokenLists)) {
    const token = list.tokens.find((token) => token.identifier === identifier);
    if (token?.logoURI) {
      return token.logoURI;
    }
  }

  return undefined;
}
