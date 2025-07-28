# @swapkit/helpers

## 4.0.0-beta.34

### Patch Changes

- [#1404](https://github.com/swapkit/SwapKit/pull/1404) [`0c7a3a2`](https://github.com/swapkit/SwapKit/commit/0c7a3a24dbfdfe0562b838993f34ded4dbe573bc) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Server/Client split, type definitions and new goodies

- Updated dependencies [[`0c7a3a2`](https://github.com/swapkit/SwapKit/commit/0c7a3a24dbfdfe0562b838993f34ded4dbe573bc)]:
  - @swapkit/contracts@4.0.0-beta.2
  - @swapkit/tokens@4.0.0-beta.2

## 4.0.0-beta.33

### Patch Changes

- [`bf2a018`](https://github.com/swapkit/SwapKit/commit/bf2a018ba2f5769158b0b90d71f4dd37fae8c6fe) Thanks [@towanTG](https://github.com/towanTG)! - Changes Poligon Chain denom

## 4.0.0-beta.32

### Patch Changes

- [`94724c5`](https://github.com/swapkit/SwapKit/commit/94724c51fa064cce28ec2ad685e277e86a604dc2) Thanks [@towanTG](https://github.com/towanTG)! - Bump all packages

## 4.0.0-beta.31

### Patch Changes

- [#1388](https://github.com/swapkit/SwapKit/pull/1388) [`54e38a0`](https://github.com/swapkit/SwapKit/commit/54e38a074f5393c162b8f7b007a8aef46e7d8002) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Addition of `@noble/hashes` version 2.0.0

## 4.0.0-beta.30

### Patch Changes

- [`69b4aec`](https://github.com/swapkit/SwapKit/commit/69b4aec824013ede9ca797aa11244442ef389250) Thanks [@towanTG](https://github.com/towanTG)! - Fixes AssetValue Token parsing for TRX

## 4.0.0-beta.29

### Patch Changes

- [`2bebe67`](https://github.com/swapkit/SwapKit/commit/2bebe67b7933887b33b92863590a2e89ef73b9b7) Thanks [@towanTG](https://github.com/towanTG)! - Adds Tron approve to toolbox

## 4.0.0-beta.28

### Patch Changes

- [`c5f646c`](https://github.com/swapkit/SwapKit/commit/c5f646cc40fe1fc1347b68e1996321f048f9d3ac) Thanks [@towanTG](https://github.com/towanTG)! - Fixes TRC20 ABI and rpc urls

- [`8e89afc`](https://github.com/swapkit/SwapKit/commit/8e89afc5c8d9490ddefd616d4567c883cf02787f) Thanks [@towanTG](https://github.com/towanTG)! - Fixes Zcash rpc endpoint

## 4.0.0-beta.27

### Patch Changes

- [`dfaf1fb`](https://github.com/swapkit/SwapKit/commit/dfaf1fb64043ca706e463b244135afe998ce2e07) Thanks [@towanTG](https://github.com/towanTG)! - General bump to fix bun lock

## 4.0.0-beta.26

### Patch Changes

- [`b341967`](https://github.com/swapkit/SwapKit/commit/b341967b9db2ef591fa8e6adda5dcfccb14e0fa8) Thanks [@towanTG](https://github.com/towanTG)! - General Patch Bump

- [`a74d2ee`](https://github.com/swapkit/SwapKit/commit/a74d2ee7dbfa5c9426855e8a09d3be3ae2bf967b) Thanks [@towanTG](https://github.com/towanTG)! - Adds Trongrid TRC20 token lookup

## 4.0.0-beta.25

### Patch Changes

- [#1381](https://github.com/swapkit/SwapKit/pull/1381) [`cbc71e3`](https://github.com/swapkit/SwapKit/commit/cbc71e3f5a76018db4984e7b90e78ba7aaa7208b) Thanks [@towanTG](https://github.com/towanTG)! - Wraps Near validate address in a getter function to remove Promise return of actual validation

- [#1381](https://github.com/swapkit/SwapKit/pull/1381) [`cbc71e3`](https://github.com/swapkit/SwapKit/commit/cbc71e3f5a76018db4984e7b90e78ba7aaa7208b) Thanks [@towanTG](https://github.com/towanTG)! - feat: Add Xaman (XUMM) wallet integration

  - Added support for Xaman (formerly XUMM) mobile wallet for Ripple/XRP transactions
  - Added XAMAN to WalletOption enum in @swapkit/helpers
  - Added `xaman` to SKConfig apiKeys for centralized API key management
  - Added wallet-specific error codes for better error handling
  - Supports QR code and deep linking for mobile transaction signing
  - Includes destination tag support for exchange addresses
  - Uses official xumm SDK v1.8.0

## 4.0.0-beta.24

### Patch Changes

- [#1375](https://github.com/swapkit/SwapKit/pull/1375) [`0575471`](https://github.com/swapkit/SwapKit/commit/0575471042bb3514163ac6ed703cc637c1e14569) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Update range for deps and lock for devDeps

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
