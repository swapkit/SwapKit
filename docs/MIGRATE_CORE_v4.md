# MIGRATE FROM CORE v3 to v4

## Breaking changes

### Removed

#### @swapkit/api

- `computeHashForGet` -> use `computeHash` directly
- `computeHashForPost` -> use `computeHash` directly
- `getSwapQuoteV2` -> use `getSwapQuote` directly
- `getTokenListV2` -> use `getTokenList` directly

#### @swapkit/core

- `validateAddress` -> use `getAddressValidator` directly



