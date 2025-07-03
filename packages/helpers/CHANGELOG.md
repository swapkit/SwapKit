# @swapkit/helpers

## 3.0.0-beta.22

### Patch Changes

- [`97162d9`](https://github.com/swapkit/SwapKit/commit/97162d9b33aca66304489db059fd18d76fa3a709) Thanks [@towanTG](https://github.com/towanTG)! - Fixes dynamicHeader usage in requestClient

## 3.0.0-beta.21

### Patch Changes

- [`3d10c9a`](https://github.com/swapkit/SwapKit/commit/3d10c9afcc107879afb917ba4491eb6bd555f6e0) Thanks [@towanTG](https://github.com/towanTG)! - Adds RPC Test body for XRP

## 3.0.0-beta.20

### Patch Changes

- [`296316d`](https://github.com/swapkit/SwapKit/commit/296316dd8e56d51ccb39ee2145e52b09ee01a880) Thanks [@towanTG](https://github.com/towanTG)! - Adds missing chains to getRpcBody

## 3.0.0-beta.19

### Patch Changes

- [`c4764b6`](https://github.com/swapkit/SwapKit/commit/c4764b6178c4aa94c35f827c052288566d4f2ed5) Thanks [@towanTG](https://github.com/towanTG)! - Fixes sk api key usage

## 3.0.0-beta.18

### Patch Changes

- [`ee9cf70`](https://github.com/swapkit/SwapKit/commit/ee9cf70ae6585ebd3754a99f97a79f216d4918f9) Thanks [@towanTG](https://github.com/towanTG)! - Fixes tron transaction creation and walletconnect lib update

## 3.0.0-beta.17

### Patch Changes

- [`ed8019e`](https://github.com/swapkit/SwapKit/commit/ed8019efdb010a0d024e5bd7b0ddb2f6afa4d956) Thanks [@towanTG](https://github.com/towanTG)! - Fixes getBalance for cosmos and substrate toolboxes

## 3.0.0-beta.16

### Patch Changes

- [`96346ac`](https://github.com/swapkit/SwapKit/commit/96346acf03f1cd80ce073b95c52bc85ee13ef443) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Correct Tron ChainId and cleans toolbox code

## 3.0.0-beta.15

### Patch Changes

- [#1354](https://github.com/swapkit/SwapKit/pull/1354) [`12af242`](https://github.com/swapkit/SwapKit/commit/12af242176195a99821d9b49c5af8355bcf920a5) Thanks [@towanTG](https://github.com/towanTG)! - Add NEAR Protocol support to multiple wallets

  - Add NEAR support to Ledger hardware wallet using @ledgerhq/hw-app-near
  - Add NEAR support to OKX browser extension wallet
  - Add NEAR support to WalletConnect v2 protocol
  - Add NEAR support to CTRL (formerly XDEFI) browser extension wallet
  - Create shared NEAR signer utilities for consistent wallet integration
  - Add NEAR chain IDs and configuration for mainnet/testnet
  - Update window type definitions to include NEAR providers

  Each wallet implementation includes:

  - Address retrieval and management
  - Transaction signing capabilities
  - Integration with NEAR toolbox
  - Proper error handling

  Note: Message signing support varies by wallet due to hardware/protocol limitations.

## 3.0.0-beta.14

### Patch Changes

- [`586d96e`](https://github.com/thorswap/SwapKit/commit/586d96e7118476cd0bc45ad5581b60e5cf77e4cb) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Fixes web3 wallet method wrapper

## 3.0.0-beta.13

### Patch Changes

- [#1350](https://github.com/thorswap/SwapKit/pull/1350) [`6690e59`](https://github.com/thorswap/SwapKit/commit/6690e595541eac0785e56d50024f8628a4173f6f) Thanks [@towanTG](https://github.com/towanTG)! - Fixes the precision of baseValue when returned by getBaseValue by rounding the bigint value correctly

## 3.0.0-beta.12

### Patch Changes

- [#1343](https://github.com/thorswap/SwapKit/pull/1343) [`feadd9a`](https://github.com/thorswap/SwapKit/commit/feadd9ab64f4b56d0127a924f4cebf3e87e003c4) Thanks [@towanTG](https://github.com/towanTG)! - Adds SKConfig functionality to set headers on midgard endpoints

## 3.0.0-beta.11

### Minor Changes

- [#1328](https://github.com/thorswap/SwapKit/pull/1328) [`ae58e58`](https://github.com/thorswap/SwapKit/commit/ae58e5813ba5e8d2372b449b09b1c813659a93c1) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Upstream near and solana changes

## 3.0.0-beta.10

### Patch Changes

- [`bf6e25c`](https://github.com/thorswap/SwapKit/commit/bf6e25c14a86db6f7c371bbd472b267a9107c9c6) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Fixes CTRL browser provider usage

## 3.0.0-beta.9

### Patch Changes

- [`4a38b18`](https://github.com/thorswap/SwapKit/commit/4a38b18df4c508bdfa5803a69ba99e7d56a17639) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Changes async import style to accomodate commonjs packages

## 3.0.0-beta.8

### Patch Changes

- [#1309](https://github.com/thorswap/SwapKit/pull/1309) [`bf4d792`](https://github.com/thorswap/SwapKit/commit/bf4d792ade9cab35f3f0e54f14d7864f36bbd53a) Thanks [@towanTG](https://github.com/towanTG)! - Modified AssetValue to store EVM addresses in a case-sensitive manner, rather than converting them to lowercase.

## 3.0.0-beta.7

### Patch Changes

- [#1307](https://github.com/thorswap/SwapKit/pull/1307) [`983ca27`](https://github.com/thorswap/SwapKit/commit/983ca27d7c47279b01a0bdaba53636023f455ba5) Thanks [@towanTG](https://github.com/towanTG)! - Changes XRD.XRD identifier

## 3.0.0-beta.6

### Patch Changes

- [#1303](https://github.com/thorswap/SwapKit/pull/1303) [`8e2340d`](https://github.com/thorswap/SwapKit/commit/8e2340d290b149bfad25e57f76e0495c769d4bfd) Thanks [@towanTG](https://github.com/towanTG)! - Throws error if AssetValue.from encounters an unknown chain

## 3.0.0-beta.5

### Patch Changes

- [#1286](https://github.com/thorswap/SwapKit/pull/1286) [`299401a`](https://github.com/thorswap/SwapKit/commit/299401a194a8c31f9909f5da3f61f605ed1e41ac) Thanks [@towanTG](https://github.com/towanTG)! - Improves tokenmap handling when setting static assets

## 3.0.0-beta.4

### Minor Changes

- [#1284](https://github.com/thorswap/SwapKit/pull/1284) [`3c195cb`](https://github.com/thorswap/SwapKit/commit/3c195cba593ff75a1eccf3a79712f538c08a617d) Thanks [@towanTG](https://github.com/towanTG)! - Adds setStaticAssets method to assetValue to manually overwrite the tokenlist used

### Patch Changes

- [#1284](https://github.com/thorswap/SwapKit/pull/1284) [`3c195cb`](https://github.com/thorswap/SwapKit/commit/3c195cba593ff75a1eccf3a79712f538c08a617d) Thanks [@towanTG](https://github.com/towanTG)! - Improves typing of thorname related methods and switched node:crypto back to crypto

## 3.0.0-beta.3

### Minor Changes

- [#1282](https://github.com/thorswap/SwapKit/pull/1282) [`54fb82a`](https://github.com/thorswap/SwapKit/commit/54fb82a0a13e63a22ba208af3ab76efe59d9a20e) Thanks [@towanTG](https://github.com/towanTG)! - Fix Avax common asset info

- [#1282](https://github.com/thorswap/SwapKit/pull/1282) [`54fb82a`](https://github.com/thorswap/SwapKit/commit/54fb82a0a13e63a22ba208af3ab76efe59d9a20e) Thanks [@towanTG](https://github.com/towanTG)! - Update more avax ug logic

## 3.0.0-beta.2

### Patch Changes

- [#1276](https://github.com/thorswap/SwapKit/pull/1276) [`90539f9`](https://github.com/thorswap/SwapKit/commit/90539f947df9d424c6c3f0d0cc695e08285d2581) Thanks [@towanTG](https://github.com/towanTG)! - Updates token lists

## 3.0.0-beta.1

### Patch Changes

- [#1264](https://github.com/thorswap/SwapKit/pull/1264) [`590984f`](https://github.com/thorswap/SwapKit/commit/590984f4e4744e8f9dfe47734f760b3a3b6c5c23) Thanks [@towanTG](https://github.com/towanTG)! - Fixes lower case bug in AssetValue.from

## 3.0.0-beta.0

### Major Changes

- [`8f8feee`](https://github.com/thorswap/SwapKit/commit/8f8feee8bf28dc7704346cfb205f80ed86668f41) Thanks [@ice-chillios](https://github.com/ice-chillios)! - v4 core first beta

### Minor Changes

- [#1210](https://github.com/thorswap/SwapKit/pull/1210) [`c1e7813`](https://github.com/thorswap/SwapKit/commit/c1e78139b2abe417910cf8ebad4b4f40c248787c) Thanks [@ice-chillios](https://github.com/ice-chillios)! - @swapkit/ui & async imports
