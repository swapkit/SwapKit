# MIGRATE FROM CORE v3 to v4

> [!IMPORTANT]Read before continue
> We migrated to combined functionality packages to simplify developer experience. You will have to change imports to use the new version of the packages.
>
> To help with migration we noted how imports changed in the following sections with the format:
>
> `swapkitPackage => migratedSwapkitPackage`


### <font color="magenta">Package Migrations</font>

#### Installation

_before_
```bash
# Toolboxes
$ bun install @swapkit/toolbox-cosmos @swapkit/toolbox-evm @swapkit/toolbox-radix @swapkit/toolbox-solana @swapkit/toolbox-substrate @swapkit/toolbox-utxo

# Plugins
$ bun install @swapkit/plugin-chainflip @swapkit/plugin-evm @swapkit/plugin-kado @swapkit/plugin-radix @swapkit/plugin-thorchain

# Helpers and others
$ bun install @swapkit/helpers @swapkit/api @swapkit/contracts @swapkit/tokens
```
_after_
```bash
# Toolboxes
$ bun install @swapkit/toolboxes

# Plugins
$ bun install @swapkit/plugins

# Helpers and others
$ bun install @swapkit/helpers
```

#### Imports
| Old                        | New                          |
| -------------------------- | ---------------------------- |
| @swapkit/api               | @swapkit/helpers/api         |
| @swapkit/contracts         | @swapkit/helpers/contracts   |
| @swapkit/tokens            | @swapkit/helpers/tokens      |
| @swapkit/plugin-chainflip  | @swapkit/plugins/chainflip   |
| @swapkit/plugin-evm        | @swapkit/plugins/evm         |
| @swapkit/plugin-kado       | @swapkit/plugins/kado        |
| @swapkit/plugin-radix      | @swapkit/plugins/radix       |
| @swapkit/plugin-thorchain  | @swapkit/plugins/thorchain   |
| @swapkit/toolbox-cosmos    | @swapkit/toolboxes/cosmos    |
| @swapkit/toolbox-evm       | @swapkit/toolboxes/evm       |
| @swapkit/toolbox-radix     | @swapkit/toolboxes/radix     |
| @swapkit/toolbox-solana    | @swapkit/toolboxes/solana    |
| @swapkit/toolbox-substrate | @swapkit/toolboxes/substrate |
| @swapkit/toolbox-utxo      | @swapkit/toolboxes/utxo      |


### <font color="lightGreen">Added</font>

#### @swapkit/helpers

- `SKConfig` - configuration module for handling api keys and other configuration options
- Now combines `@swapkit/api`, `@swapkit/contracts`, `@swapkit/tokens` under a single package

#### @swapkit/plugins

- `createPlugin` - factory function to create a new plugin
- Now combines `@swapkit/plugin-evm`, `@swapkit/plugin-cosmos`, `@swapkit/plugin-solana`, `@swapkit/plugin-substrate`, `@swapkit/plugin-utxo` under a single package

#### @swapkit/toolboxes

- Now combines `@swapkit/toolbox-evm`, `@swapkit/toolbox-cosmos`, `@swapkit/toolbox-solana`, `@swapkit/toolbox-substrate`, `@swapkit/toolbox-utxo` under a single package

### <font color="pink">Removed</font>

#### @swapkit/api => @swapkit/helpers/api

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


#### @swapkit/toolbox-cosmos => @swapkit/toolboxes/cosmos
#### @swapkit/toolbox-evm => @swapkit/toolboxes/evm
#### @swapkit/toolbox-radix => @swapkit/toolboxes/radix
#### @swapkit/toolbox-solana => @swapkit/toolboxes/solana
#### @swapkit/toolbox-substrate => @swapkit/toolboxes/substrate
#### @swapkit/toolbox-utxo => @swapkit/toolboxes/utxo
#### @swapkit/plugin-chainflip => @swapkit/plugins/chainflip
#### @swapkit/plugin-evm => @swapkit/plugins/evm
#### @swapkit/plugin-kado => @swapkit/plugins/kado
#### @swapkit/plugin-radix => @swapkit/plugins/radix
#### @swapkit/plugin-thorchain => @swapkit/plugins/thorchain

