# @swapkit/wallet-bitget

## 1.1.5

### Patch Changes

- Updated dependencies [[`fed32e2`](https://github.com/thorswap/SwapKit/commit/fed32e2a3cff4e5282d5dfaebe66e9234f6b6149)]:
  - @swapkit/toolbox-evm@1.8.5
  - @swapkit/helpers@2.4.2

## 1.1.4

### Patch Changes

- Updated dependencies []:
  - @swapkit/helpers@2.4.2
  - @swapkit/toolbox-cosmos@1.8.4
  - @swapkit/toolbox-evm@1.8.4
  - @swapkit/toolbox-solana@1.4.4
  - @swapkit/toolbox-utxo@1.2.16

## 1.1.3

### Patch Changes

- Updated dependencies []:
  - @swapkit/helpers@2.4.1
  - @swapkit/toolbox-cosmos@1.8.3
  - @swapkit/toolbox-evm@1.8.3
  - @swapkit/toolbox-solana@1.4.3
  - @swapkit/toolbox-utxo@1.2.15

## 1.1.2

### Patch Changes

- Updated dependencies [[`e83f766`](https://github.com/thorswap/SwapKit/commit/e83f766be9e7fc632aef1d68ea22bf7a0656c836)]:
  - @swapkit/helpers@2.4.0
  - @swapkit/toolbox-cosmos@1.8.2
  - @swapkit/toolbox-evm@1.8.2
  - @swapkit/toolbox-solana@1.4.2
  - @swapkit/toolbox-utxo@1.2.14

## 1.1.1

### Patch Changes

- Updated dependencies []:
  - @swapkit/helpers@2.3.1
  - @swapkit/toolbox-cosmos@1.8.1
  - @swapkit/toolbox-evm@1.8.1
  - @swapkit/toolbox-solana@1.4.1
  - @swapkit/toolbox-utxo@1.2.13

## 1.1.0

### Minor Changes

- [#1145](https://github.com/thorswap/SwapKit/pull/1145) [`d05a9c7`](https://github.com/thorswap/SwapKit/commit/d05a9c749b24ea466c9afaeebd8eff6334ad8232) Thanks [@towanTG](https://github.com/towanTG)! - Breaking Change in @swapkit/tokens:

  **What:**

  - Moved the tokenlists exports from into a new subobject `tokenLists` within the same module
  - added getTokenIcon that returns the Icon url for a given identifier

  **How to adept code:**
  Use new way of importing the lists

  ```

  import {tokenLists, getTokenIcon} from '@swapkit/tokens'

  ```

  Other packages just got some typing updates - no code changes needed

- [#1145](https://github.com/thorswap/SwapKit/pull/1145) [`d05a9c7`](https://github.com/thorswap/SwapKit/commit/d05a9c749b24ea466c9afaeebd8eff6334ad8232) Thanks [@towanTG](https://github.com/towanTG)! - Uses addEVMNetwork only as fallback if the network is not yet known to the wallet

### Patch Changes

- Updated dependencies [[`d05a9c7`](https://github.com/thorswap/SwapKit/commit/d05a9c749b24ea466c9afaeebd8eff6334ad8232), [`d05a9c7`](https://github.com/thorswap/SwapKit/commit/d05a9c749b24ea466c9afaeebd8eff6334ad8232), [`d05a9c7`](https://github.com/thorswap/SwapKit/commit/d05a9c749b24ea466c9afaeebd8eff6334ad8232)]:
  - @swapkit/toolbox-cosmos@1.8.0
  - @swapkit/toolbox-solana@1.4.0
  - @swapkit/helpers@2.3.0
  - @swapkit/toolbox-evm@1.8.0
  - @swapkit/toolbox-utxo@1.2.12

## 1.0.5

### Patch Changes

- Updated dependencies [[`0dc7610`](https://github.com/thorswap/SwapKit/commit/0dc76102577e091dfdd9fc72b2cc751109ab5faf)]:
  - @swapkit/helpers@2.2.1
  - @swapkit/toolbox-cosmos@1.7.3
  - @swapkit/toolbox-evm@1.7.11
  - @swapkit/toolbox-solana@1.3.12
  - @swapkit/toolbox-utxo@1.2.11

## 1.0.4

### Patch Changes

- Updated dependencies []:
  - @swapkit/toolbox-cosmos@1.7.2
  - @swapkit/helpers@2.2.0

## 1.0.3

### Patch Changes

- Updated dependencies []:
  - @swapkit/toolbox-cosmos@1.7.1
  - @swapkit/helpers@2.2.0

## 1.0.2

### Patch Changes

- Updated dependencies [[`6a0e9d9`](https://github.com/thorswap/SwapKit/commit/6a0e9d94ef88df26785f55d4f293095666dc28d8)]:
  - @swapkit/toolbox-cosmos@1.7.0
  - @swapkit/helpers@2.2.0

## 1.0.1

### Patch Changes

- [#1127](https://github.com/thorswap/SwapKit/pull/1127) [`993774d`](https://github.com/thorswap/SwapKit/commit/993774d8f83199e7766ebd359d766a52c8720abe) Thanks [@towanTG](https://github.com/towanTG)! - Updates dependencies

- Updated dependencies [[`993774d`](https://github.com/thorswap/SwapKit/commit/993774d8f83199e7766ebd359d766a52c8720abe)]:
  - @swapkit/toolbox-solana@1.3.11
  - @swapkit/helpers@2.2.0

## 1.0.0

### Major Changes

- [#1109](https://github.com/thorswap/SwapKit/pull/1109) [`cc61490`](https://github.com/thorswap/SwapKit/commit/cc61490c52782468ab6e4494e5120df5b2f6d038) Thanks [@0xepicode](https://github.com/0xepicode)! - Bitget wallet

### Minor Changes

- [#1109](https://github.com/thorswap/SwapKit/pull/1109) [`cc61490`](https://github.com/thorswap/SwapKit/commit/cc61490c52782468ab6e4494e5120df5b2f6d038) Thanks [@0xepicode](https://github.com/0xepicode)! - Removes Kuji reference and adds new SwapKitError codes

### Patch Changes

- Updated dependencies [[`cc61490`](https://github.com/thorswap/SwapKit/commit/cc61490c52782468ab6e4494e5120df5b2f6d038), [`cc61490`](https://github.com/thorswap/SwapKit/commit/cc61490c52782468ab6e4494e5120df5b2f6d038), [`cc61490`](https://github.com/thorswap/SwapKit/commit/cc61490c52782468ab6e4494e5120df5b2f6d038)]:
  - @swapkit/helpers@2.2.0
  - @swapkit/toolbox-cosmos@1.6.4
  - @swapkit/toolbox-evm@1.7.10
  - @swapkit/toolbox-utxo@1.2.10
