# MIGRATE FROM CORE v3 to v4

## Breaking changes

### Added

#### @swapkit/helpers

- `SKConfig` - configuration module for handling api keys and other configuration options

### Removed

#### @swapkit/api

- `computeHashForGet` -> use `computeHash` directly
- `computeHashForPost` -> use `computeHash` directly
- `getSwapQuoteV2` -> use `getSwapQuote` directly
- `getTokenListV2` -> use `getTokenList` directly

#### @swapkit/core

- `validateAddress` -> use `getAddressValidator` directly
- `api` -> use `SwapKitApi` directly. For configuration use `SKConfig`

#### @swapkit/helpers

- `ensureEVMApiKeys` -> removed
- `setRequestClientConfig` -> removed - use `SKConfig` directly
