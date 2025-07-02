# @swapkit/wallets

## 3.0.0-beta.30

### Patch Changes

- [`ee9cf70`](https://github.com/swapkit/SwapKit/commit/ee9cf70ae6585ebd3754a99f97a79f216d4918f9) Thanks [@towanTG](https://github.com/towanTG)! - Fixes tron transaction creation and walletconnect lib update

- Updated dependencies [[`ee9cf70`](https://github.com/swapkit/SwapKit/commit/ee9cf70ae6585ebd3754a99f97a79f216d4918f9)]:
  - @swapkit/toolboxes@1.0.0-beta.27
  - @swapkit/helpers@3.0.0-beta.18

## 3.0.0-beta.29

### Patch Changes

- Updated dependencies [[`bb5c35a`](https://github.com/swapkit/SwapKit/commit/bb5c35a9a3ceff75cbfe411f7343e15f256a5717)]:
  - @swapkit/toolboxes@1.0.0-beta.26
  - @swapkit/helpers@3.0.0-beta.17

## 3.0.0-beta.28

### Patch Changes

- [`8ea9ce7`](https://github.com/swapkit/SwapKit/commit/8ea9ce78c9c718dff8237a54187547f26693f01e) Thanks [@towanTG](https://github.com/towanTG)! - Changes cosmjs imports to be better usable with bundlers

- Updated dependencies [[`8ea9ce7`](https://github.com/swapkit/SwapKit/commit/8ea9ce78c9c718dff8237a54187547f26693f01e)]:
  - @swapkit/toolboxes@1.0.0-beta.25
  - @swapkit/helpers@3.0.0-beta.17

## 3.0.0-beta.27

### Patch Changes

- [`ed8019e`](https://github.com/swapkit/SwapKit/commit/ed8019efdb010a0d024e5bd7b0ddb2f6afa4d956) Thanks [@towanTG](https://github.com/towanTG)! - Fixes getBalance for cosmos and substrate toolboxes

- Updated dependencies [[`ed8019e`](https://github.com/swapkit/SwapKit/commit/ed8019efdb010a0d024e5bd7b0ddb2f6afa4d956)]:
  - @swapkit/toolboxes@1.0.0-beta.24
  - @swapkit/helpers@3.0.0-beta.17

## 3.0.0-beta.26

### Patch Changes

- Updated dependencies [[`97fb9d4`](https://github.com/swapkit/SwapKit/commit/97fb9d4399d4eb55981f72017aa802d70579e6d7)]:
  - @swapkit/toolboxes@1.0.0-beta.23
  - @swapkit/helpers@3.0.0-beta.16

## 3.0.0-beta.25

### Patch Changes

- Updated dependencies [[`96346ac`](https://github.com/swapkit/SwapKit/commit/96346acf03f1cd80ce073b95c52bc85ee13ef443)]:
  - @swapkit/toolboxes@1.0.0-beta.22
  - @swapkit/helpers@3.0.0-beta.16

## 3.0.0-beta.24

### Patch Changes

- Updated dependencies [[`08e32d1`](https://github.com/swapkit/SwapKit/commit/08e32d1f74f08083f22bf8d7d64ae17df49ef123)]:
  - @swapkit/toolboxes@1.0.0-beta.21
  - @swapkit/helpers@3.0.0-beta.15

## 3.0.0-beta.23

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`12af242`](https://github.com/swapkit/SwapKit/commit/12af242176195a99821d9b49c5af8355bcf920a5), [`12af242`](https://github.com/swapkit/SwapKit/commit/12af242176195a99821d9b49c5af8355bcf920a5)]:
  - @swapkit/toolboxes@1.0.0-beta.20
  - @swapkit/helpers@3.0.0-beta.15

## 3.0.0-beta.22

### Patch Changes

- Updated dependencies [[`586d96e`](https://github.com/thorswap/SwapKit/commit/586d96e7118476cd0bc45ad5581b60e5cf77e4cb)]:
  - @swapkit/helpers@3.0.0-beta.14
  - @swapkit/toolboxes@1.0.0-beta.19

## 3.0.0-beta.21

### Patch Changes

- Updated dependencies [[`6690e59`](https://github.com/thorswap/SwapKit/commit/6690e595541eac0785e56d50024f8628a4173f6f)]:
  - @swapkit/helpers@3.0.0-beta.13
  - @swapkit/toolboxes@1.0.0-beta.18

## 3.0.0-beta.20

### Patch Changes

- Updated dependencies [[`feadd9a`](https://github.com/thorswap/SwapKit/commit/feadd9ab64f4b56d0127a924f4cebf3e87e003c4)]:
  - @swapkit/helpers@3.0.0-beta.12
  - @swapkit/toolboxes@1.0.0-beta.17

## 3.0.0-beta.19

### Patch Changes

- [`f95efef`](https://github.com/thorswap/SwapKit/commit/f95efef7a9d9047ff12b7c6dc3c929eca057718e) Thanks [@towanTG](https://github.com/towanTG)! - Fixes Ctrl getAddress provider communication

## 3.0.0-beta.18

### Minor Changes

- [#1328](https://github.com/thorswap/SwapKit/pull/1328) [`ae58e58`](https://github.com/thorswap/SwapKit/commit/ae58e5813ba5e8d2372b449b09b1c813659a93c1) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Upstream near and solana changes

### Patch Changes

- [#1334](https://github.com/thorswap/SwapKit/pull/1334) [`b48d865`](https://github.com/thorswap/SwapKit/commit/b48d8657a4bb389d7637027fac174bead16785c6) Thanks [@towanTG](https://github.com/towanTG)! - Fixes Ctrl Wallet provider communication

- Updated dependencies [[`ae58e58`](https://github.com/thorswap/SwapKit/commit/ae58e5813ba5e8d2372b449b09b1c813659a93c1)]:
  - @swapkit/toolboxes@1.0.0-beta.16
  - @swapkit/helpers@3.0.0-beta.11

## 3.0.0-beta.17

### Patch Changes

- [`bf6e25c`](https://github.com/thorswap/SwapKit/commit/bf6e25c14a86db6f7c371bbd472b267a9107c9c6) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Fixes CTRL browser provider usage

- Updated dependencies [[`bf6e25c`](https://github.com/thorswap/SwapKit/commit/bf6e25c14a86db6f7c371bbd472b267a9107c9c6)]:
  - @swapkit/helpers@3.0.0-beta.10
  - @swapkit/toolboxes@1.0.0-beta.15

## 3.0.0-beta.16

### Patch Changes

- [`a1bdbc9`](https://github.com/thorswap/SwapKit/commit/a1bdbc979e3edbd36b2cfc0ca2e61d8c0c19d017) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Fixes ledger imports

## 3.0.0-beta.15

### Patch Changes

- [`afca172`](https://github.com/thorswap/SwapKit/commit/afca172a172d726365efc56ad50ad8b96b9a55da) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Fixes import for ledger devices lib

## 3.0.0-beta.14

### Patch Changes

- [`446dc71`](https://github.com/thorswap/SwapKit/commit/446dc714b786520c842d4d62b1412f695956f726) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Removes async imports from utxo releated imports

- Updated dependencies [[`446dc71`](https://github.com/thorswap/SwapKit/commit/446dc714b786520c842d4d62b1412f695956f726)]:
  - @swapkit/toolboxes@1.0.0-beta.14
  - @swapkit/helpers@3.0.0-beta.9

## 3.0.0-beta.13

### Patch Changes

- [`dbf4faa`](https://github.com/thorswap/SwapKit/commit/dbf4faad491b69d7bb034a21aadfa02ce18c280d) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Changes coininfo import

- Updated dependencies [[`dbf4faa`](https://github.com/thorswap/SwapKit/commit/dbf4faad491b69d7bb034a21aadfa02ce18c280d)]:
  - @swapkit/toolboxes@1.0.0-beta.13
  - @swapkit/helpers@3.0.0-beta.9

## 3.0.0-beta.12

### Patch Changes

- [`ca3af62`](https://github.com/thorswap/SwapKit/commit/ca3af62b11fb61c8c316ac97d3c4474f718ef079) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Changes @psf/\* imports to commonjs default

- Updated dependencies [[`ca3af62`](https://github.com/thorswap/SwapKit/commit/ca3af62b11fb61c8c316ac97d3c4474f718ef079)]:
  - @swapkit/toolboxes@1.0.0-beta.12
  - @swapkit/helpers@3.0.0-beta.9

## 3.0.0-beta.11

### Patch Changes

- [`737100a`](https://github.com/thorswap/SwapKit/commit/737100abfe512eb5037047a7ae24876e4e87cb3a) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Moves bitcoinjs lib imports to esm type

- [`e08470a`](https://github.com/thorswap/SwapKit/commit/e08470a0e7c72cfd93736ed556fcf90e64d9e64b) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Use ESM @solana imports instead of commonjs

- Updated dependencies [[`737100a`](https://github.com/thorswap/SwapKit/commit/737100abfe512eb5037047a7ae24876e4e87cb3a), [`e08470a`](https://github.com/thorswap/SwapKit/commit/e08470a0e7c72cfd93736ed556fcf90e64d9e64b)]:
  - @swapkit/toolboxes@1.0.0-beta.11
  - @swapkit/helpers@3.0.0-beta.9

## 3.0.0-beta.10

### Patch Changes

- [`4a38b18`](https://github.com/thorswap/SwapKit/commit/4a38b18df4c508bdfa5803a69ba99e7d56a17639) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - Changes async import style to accomodate commonjs packages

- Updated dependencies [[`4a38b18`](https://github.com/thorswap/SwapKit/commit/4a38b18df4c508bdfa5803a69ba99e7d56a17639)]:
  - @swapkit/toolboxes@1.0.0-beta.10
  - @swapkit/helpers@3.0.0-beta.9

## 3.0.0-beta.9

### Patch Changes

- Updated dependencies [[`bf4d792`](https://github.com/thorswap/SwapKit/commit/bf4d792ade9cab35f3f0e54f14d7864f36bbd53a), [`bf4d792`](https://github.com/thorswap/SwapKit/commit/bf4d792ade9cab35f3f0e54f14d7864f36bbd53a)]:
  - @swapkit/helpers@3.0.0-beta.8
  - @swapkit/toolboxes@1.0.0-beta.9

## 3.0.0-beta.8

### Patch Changes

- Updated dependencies [[`983ca27`](https://github.com/thorswap/SwapKit/commit/983ca27d7c47279b01a0bdaba53636023f455ba5)]:
  - @swapkit/helpers@3.0.0-beta.7
  - @swapkit/toolboxes@1.0.0-beta.8

## 3.0.0-beta.7

### Patch Changes

- Updated dependencies [[`8e2340d`](https://github.com/thorswap/SwapKit/commit/8e2340d290b149bfad25e57f76e0495c769d4bfd)]:
  - @swapkit/helpers@3.0.0-beta.6
  - @swapkit/toolboxes@1.0.0-beta.7

## 3.0.0-beta.6

### Patch Changes

- Updated dependencies [[`793999f`](https://github.com/thorswap/SwapKit/commit/793999f2e5a11d08e445e16c8025285ee6816cef)]:
  - @swapkit/toolboxes@1.0.0-beta.6
  - @swapkit/helpers@3.0.0-beta.5

## 3.0.0-beta.5

### Patch Changes

- Updated dependencies [[`299401a`](https://github.com/thorswap/SwapKit/commit/299401a194a8c31f9909f5da3f61f605ed1e41ac)]:
  - @swapkit/helpers@3.0.0-beta.5
  - @swapkit/toolboxes@1.0.0-beta.5

## 3.0.0-beta.4

### Patch Changes

- [#1284](https://github.com/thorswap/SwapKit/pull/1284) [`3c195cb`](https://github.com/thorswap/SwapKit/commit/3c195cba593ff75a1eccf3a79712f538c08a617d) Thanks [@towanTG](https://github.com/towanTG)! - Improves typing of thorname related methods and switched node:crypto back to crypto

- Updated dependencies [[`3c195cb`](https://github.com/thorswap/SwapKit/commit/3c195cba593ff75a1eccf3a79712f538c08a617d), [`3c195cb`](https://github.com/thorswap/SwapKit/commit/3c195cba593ff75a1eccf3a79712f538c08a617d), [`3c195cb`](https://github.com/thorswap/SwapKit/commit/3c195cba593ff75a1eccf3a79712f538c08a617d)]:
  - @swapkit/toolboxes@1.0.0-beta.4
  - @swapkit/helpers@3.0.0-beta.4

## 3.0.0-beta.3

### Patch Changes

- Updated dependencies [[`54fb82a`](https://github.com/thorswap/SwapKit/commit/54fb82a0a13e63a22ba208af3ab76efe59d9a20e), [`54fb82a`](https://github.com/thorswap/SwapKit/commit/54fb82a0a13e63a22ba208af3ab76efe59d9a20e)]:
  - @swapkit/helpers@3.0.0-beta.3
  - @swapkit/toolboxes@1.0.0-beta.3

## 3.0.0-beta.2

### Patch Changes

- Updated dependencies [[`90539f9`](https://github.com/thorswap/SwapKit/commit/90539f947df9d424c6c3f0d0cc695e08285d2581)]:
  - @swapkit/helpers@3.0.0-beta.2
  - @swapkit/toolboxes@1.0.0-beta.2

## 3.0.0-beta.1

### Patch Changes

- Updated dependencies [[`590984f`](https://github.com/thorswap/SwapKit/commit/590984f4e4744e8f9dfe47734f760b3a3b6c5c23)]:
  - @swapkit/helpers@3.0.0-beta.1
  - @swapkit/toolboxes@1.0.0-beta.1

## 3.0.0-beta.0

### Major Changes

- [`8f8feee`](https://github.com/thorswap/SwapKit/commit/8f8feee8bf28dc7704346cfb205f80ed86668f41) Thanks [@ice-chillios](https://github.com/ice-chillios)! - v4 core first beta

### Minor Changes

- [#1210](https://github.com/thorswap/SwapKit/pull/1210) [`c1e7813`](https://github.com/thorswap/SwapKit/commit/c1e78139b2abe417910cf8ebad4b4f40c248787c) Thanks [@ice-chillios](https://github.com/ice-chillios)! - @swapkit/ui & async imports

### Patch Changes

- Updated dependencies [[`8f8feee`](https://github.com/thorswap/SwapKit/commit/8f8feee8bf28dc7704346cfb205f80ed86668f41), [`c1e7813`](https://github.com/thorswap/SwapKit/commit/c1e78139b2abe417910cf8ebad4b4f40c248787c)]:
  - @swapkit/toolboxes@1.0.0-beta.0
  - @swapkit/helpers@3.0.0-beta.0
