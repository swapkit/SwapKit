# @swapkit/helpers

## 4.5.2

### Patch Changes

- [#1593](https://github.com/swapkit/SwapKit/pull/1593) [`5c84d8a`](https://github.com/swapkit/SwapKit/commit/5c84d8a6525973692b23676a01995091df4a7a7d) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Passkeys wallet and rename internally for that

- Updated dependencies []:
  - @swapkit/tokens@4.1.1

## 4.5.1

### Patch Changes

- Updated dependencies [[`82d0fd8`](https://github.com/swapkit/SwapKit/commit/82d0fd8f1072d7341f45e3d07114181cec7500e1)]:
  - @swapkit/tokens@4.1.1

## 4.5.0

### Minor Changes

- [#1585](https://github.com/swapkit/SwapKit/pull/1585) [`e6f25c7`](https://github.com/swapkit/SwapKit/commit/e6f25c78b0469131c9ff6895cc506075ead6290c) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Customisable api endpoints

- [`2f181c6`](https://github.com/swapkit/SwapKit/commit/2f181c6d891d963854c5b7702a3de583c38d9317) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Updates to isolated modules & wallet extensions extraction

### Patch Changes

- Updated dependencies [[`bcb9509`](https://github.com/swapkit/SwapKit/commit/bcb9509cb004f80a7b22fdeafb2ce7d34d831c99), [`2f181c6`](https://github.com/swapkit/SwapKit/commit/2f181c6d891d963854c5b7702a3de583c38d9317)]:
  - @swapkit/types@0.3.0
  - @swapkit/tokens@4.1.0

## 4.4.5

### Patch Changes

- [#1576](https://github.com/swapkit/SwapKit/pull/1576) [`ad97c7f`](https://github.com/swapkit/SwapKit/commit/ad97c7fac861bf86ebb0eac7dd6d8e369965cd61) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Handle SUI tokens

- Updated dependencies []:
  - @swapkit/tokens@4.0.43

## 4.4.4

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.42

## 4.4.3

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.41

## 4.4.2

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.40

## 4.4.1

### Patch Changes

- [#1565](https://github.com/swapkit/SwapKit/pull/1565) [`aef8b5a`](https://github.com/swapkit/SwapKit/commit/aef8b5a1b83861d3b99941ac82136294fb85d8d8) Thanks [@towanTG](https://github.com/towanTG)! - Adds OKX Provider

- Updated dependencies []:
  - @swapkit/tokens@4.0.39

## 4.4.0

### Minor Changes

- [#1562](https://github.com/swapkit/SwapKit/pull/1562) [`3536550`](https://github.com/swapkit/SwapKit/commit/3536550dc088c491d2d5efb874439bbf39005186) Thanks [@mfaizan1](https://github.com/mfaizan1)! - Adds service to fee type enum

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.38

## 4.3.4

### Patch Changes

- [#1552](https://github.com/swapkit/SwapKit/pull/1552) [`ad9ddce`](https://github.com/swapkit/SwapKit/commit/ad9ddceab07c1fb4dbce12da34ce6ce486ee483b) Thanks [@towanTG](https://github.com/towanTG)! - Enables Xlayer for supporting wallets and corrects Xlayer config

- Updated dependencies [[`ad9ddce`](https://github.com/swapkit/SwapKit/commit/ad9ddceab07c1fb4dbce12da34ce6ce486ee483b)]:
  - @swapkit/types@0.2.3
  - @swapkit/tokens@4.0.37

## 4.3.3

### Patch Changes

- [#1547](https://github.com/swapkit/SwapKit/pull/1547) [`19f4248`](https://github.com/swapkit/SwapKit/commit/19f42485c528c006e78e1bd335e7911b90481949) Thanks [@towanTG](https://github.com/towanTG)! - Adds special gas estimation flow for gnosis

- Updated dependencies []:
  - @swapkit/tokens@4.0.36

## 4.3.2

### Patch Changes

- [#1544](https://github.com/swapkit/SwapKit/pull/1544) [`68cb4ce`](https://github.com/swapkit/SwapKit/commit/68cb4cef9ee3a4451a44eea45f52dca34506b973) Thanks [@towanTG](https://github.com/towanTG)! - Bumps near-api-js version and improves near-wallet-selector for cases that wallets do not support signTransaction

- Updated dependencies []:
  - @swapkit/tokens@4.0.35

## 4.3.1

### Patch Changes

- Updated dependencies [[`faa713e`](https://github.com/swapkit/SwapKit/commit/faa713e86b02d2ad10ca5636e545a707a74b901b)]:
  - @swapkit/tokens@4.0.34

## 4.3.0

### Minor Changes

- [#1538](https://github.com/swapkit/SwapKit/pull/1538) [`0d56165`](https://github.com/swapkit/SwapKit/commit/0d56165668372c41711bb3fbea21436cb1c7bbec) Thanks [@towanTG](https://github.com/towanTG)! - Add NEAR Wallet Selector integration

  - Added `walletSelector` wallet adapter supporting 5 NEAR wallet modules (MyNearWallet, Meteor, Sender, HERE Wallet, Nightly)
  - Added `nearWalletSelector` configuration to SKConfig integrations for optional contractId
  - Integrated wallet selector into SDK's default wallets
  - Modal auto-shows on connection for wallet selection
  - Supports mainnet only (hardcoded)

### Patch Changes

- [#1539](https://github.com/swapkit/SwapKit/pull/1539) [`357a262`](https://github.com/swapkit/SwapKit/commit/357a2625fe7d528b377b2cac954dcab7a6adc421) Thanks [@towanTG](https://github.com/towanTG)! - Ledger and OKX Near Wallet improvment and fixes

- Updated dependencies [[`357a262`](https://github.com/swapkit/SwapKit/commit/357a2625fe7d528b377b2cac954dcab7a6adc421)]:
  - @swapkit/types@0.2.2
  - @swapkit/tokens@4.0.33

## 4.2.3

### Patch Changes

- Updated dependencies [[`d7b12b5`](https://github.com/swapkit/SwapKit/commit/d7b12b5d9b521672598c1372ce8801699c1f751d)]:
  - @swapkit/types@0.2.1
  - @swapkit/tokens@4.0.32

## 4.2.2

### Patch Changes

- [#1526](https://github.com/swapkit/SwapKit/pull/1526) [`41ea03c`](https://github.com/swapkit/SwapKit/commit/41ea03cc82888137680b97f1fba986f5750692c2) Thanks [@Drakeoon](https://github.com/Drakeoon)! - Adds sidebar allowing to configure SwapKitWidget in Nextjs playground

- Updated dependencies []:
  - @swapkit/tokens@4.0.31

## 4.2.1

### Patch Changes

- [#1524](https://github.com/swapkit/SwapKit/pull/1524) [`0700c2b`](https://github.com/swapkit/SwapKit/commit/0700c2b7f1990e6ddebe77df88506ae3c08ff8e1) Thanks [@towanTG](https://github.com/towanTG)! - Fixes garden plugin

- Updated dependencies []:
  - @swapkit/tokens@4.0.30

## 4.2.0

### Minor Changes

- [#1522](https://github.com/swapkit/SwapKit/pull/1522) [`327aefe`](https://github.com/swapkit/SwapKit/commit/327aefe0d5fd97cac3c3e999b3fb1eed5de2eb79) Thanks [@towanTG](https://github.com/towanTG)! - Adds Garden Plugin and Provider

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.29

## 4.1.0

### Minor Changes

- [#1498](https://github.com/swapkit/SwapKit/pull/1498) [`3192cc0`](https://github.com/swapkit/SwapKit/commit/3192cc00a132dfc02715829586b3cb6ed94ca15f) Thanks [@ice-chillios](https://github.com/ice-chillios)! - New Chains: ADA, SUI, TON

- [#1515](https://github.com/swapkit/SwapKit/pull/1515) [`da3ca10`](https://github.com/swapkit/SwapKit/commit/da3ca102dabe00ea14b811ca2f55e1d94b185c09) Thanks [@towanTG](https://github.com/towanTG)! - Adds new AssetValue.from combination (chain + address) with on chain ticker and decimal lookup

### Patch Changes

- [#1516](https://github.com/swapkit/SwapKit/pull/1516) [`053ea04`](https://github.com/swapkit/SwapKit/commit/053ea04567dc10a6df3e0869262056a856ab966e) Thanks [@towanTG](https://github.com/towanTG)! - Updates Tracker types

- [#1498](https://github.com/swapkit/SwapKit/pull/1498) [`3192cc0`](https://github.com/swapkit/SwapKit/commit/3192cc00a132dfc02715829586b3cb6ed94ca15f) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Migrate to @swapkit/types

- Updated dependencies [[`3192cc0`](https://github.com/swapkit/SwapKit/commit/3192cc00a132dfc02715829586b3cb6ed94ca15f), [`053ea04`](https://github.com/swapkit/SwapKit/commit/053ea04567dc10a6df3e0869262056a856ab966e), [`3192cc0`](https://github.com/swapkit/SwapKit/commit/3192cc00a132dfc02715829586b3cb6ed94ca15f)]:
  - @swapkit/types@0.2.0
  - @swapkit/tokens@4.0.28

## 4.0.27

### Patch Changes

- [`080de9c`](https://github.com/swapkit/SwapKit/commit/080de9c07a893a97ff537b7599012dd71ddcd1ca) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Fix blocktimes and remove explorer prefix

- Updated dependencies [[`080de9c`](https://github.com/swapkit/SwapKit/commit/080de9c07a893a97ff537b7599012dd71ddcd1ca)]:
  - @swapkit/types@0.1.4
  - @swapkit/tokens@4.0.27

## 4.0.26

### Patch Changes

- [#1512](https://github.com/swapkit/SwapKit/pull/1512) [`83f2caf`](https://github.com/swapkit/SwapKit/commit/83f2caf27e3a652e45a034ea0540b718767efe97) Thanks [@towanTG](https://github.com/towanTG)! - Changes deprectation warning to info text of future deprecation

- Updated dependencies [[`83f2caf`](https://github.com/swapkit/SwapKit/commit/83f2caf27e3a652e45a034ea0540b718767efe97)]:
  - @swapkit/types@0.1.3
  - @swapkit/tokens@4.0.26

## 4.0.25

### Patch Changes

- [`8814bad`](https://github.com/swapkit/SwapKit/commit/8814bad42e06568e759c66f71d25679bb7ac8021) Thanks [@towanTG](https://github.com/towanTG)! - Adds Harbor chain (Cosmos) - do not use in production

- Updated dependencies [[`795af52`](https://github.com/swapkit/SwapKit/commit/795af52318c68d13086ffa55169ccfe07f268bed)]:
  - @swapkit/types@0.1.2
  - @swapkit/tokens@4.0.25

## 4.0.24

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.24

## 4.0.23

### Patch Changes

- [#1506](https://github.com/swapkit/SwapKit/pull/1506) [`67c3786`](https://github.com/swapkit/SwapKit/commit/67c3786b4d6a0ceebfd6f8de014f770933c79903) Thanks [@towanTG](https://github.com/towanTG)! - Fixes chainId used for evm wallet network switch - was using non hex version

- Updated dependencies []:
  - @swapkit/tokens@4.0.23

## 4.0.22

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.22

## 4.0.21

### Patch Changes

- [#1452](https://github.com/swapkit/SwapKit/pull/1452) [`d18b78d`](https://github.com/swapkit/SwapKit/commit/d18b78d91f05a840829539e94bd2877e26078f3f) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Migrate to @swapkit/types

- Updated dependencies [[`d18b78d`](https://github.com/swapkit/SwapKit/commit/d18b78d91f05a840829539e94bd2877e26078f3f)]:
  - @swapkit/tokens@4.0.21
  - @swapkit/types@0.1.1

## 4.0.20

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.20

## 4.0.19

### Patch Changes

- [#1494](https://github.com/swapkit/SwapKit/pull/1494) [`6365b50`](https://github.com/swapkit/SwapKit/commit/6365b506e3ed6587298fa6ba71c846bdf7341391) Thanks [@towanTG](https://github.com/towanTG)! - Corrects block time for zcash and doge

- Updated dependencies []:
  - @swapkit/tokens@4.0.19

## 4.0.18

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.18

## 4.0.17

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.17

## 4.0.16

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.16

## 4.0.15

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.15

## 4.0.14

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.14

## 4.0.13

### Patch Changes

- [#1480](https://github.com/swapkit/SwapKit/pull/1480) [`c048f39`](https://github.com/swapkit/SwapKit/commit/c048f39a74b21182d2093e97883c1dc8971293f3) Thanks [@towanTG](https://github.com/towanTG)! - Improves ctrl and tronlink wallet integrations

- Updated dependencies []:
  - @swapkit/tokens@4.0.13

## 4.0.12

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.12

## 4.0.11

### Patch Changes

- [#1475](https://github.com/swapkit/SwapKit/pull/1475) [`229c06d`](https://github.com/swapkit/SwapKit/commit/229c06dde2fe6a65542aecffddbd38e64fd139d0) Thanks [@towanTG](https://github.com/towanTG)! - Adds support for complex near name contract addresses

- Updated dependencies []:
  - @swapkit/tokens@4.0.11

## 4.0.10

### Patch Changes

- Updated dependencies [[`28d10f5`](https://github.com/swapkit/SwapKit/commit/28d10f523cfa240bef200cc52dc52b7cc7f2496f)]:
  - @swapkit/tokens@4.0.10

## 4.0.9

### Patch Changes

- [#1471](https://github.com/swapkit/SwapKit/pull/1471) [`27a3f83`](https://github.com/swapkit/SwapKit/commit/27a3f8387d518d2eeb10262495ae7c3663318d77) Thanks [@towanTG](https://github.com/towanTG)! - Minor internal type updates, thorchain rpc url update and code maintenance

- Updated dependencies []:
  - @swapkit/tokens@4.0.9

## 4.0.8

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.8

## 4.0.7

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.7

## 4.0.6

### Patch Changes

- [#1465](https://github.com/swapkit/SwapKit/pull/1465) [`c4605c6`](https://github.com/swapkit/SwapKit/commit/c4605c667d3737691d348dde8c8d9d677b79f2ec) Thanks [@towanTG](https://github.com/towanTG)! - Retires thornode and replaces it with 9Realms

- Updated dependencies []:
  - @swapkit/tokens@4.0.6

## 4.0.5

### Patch Changes

- [#1463](https://github.com/swapkit/SwapKit/pull/1463) [`5d334e6`](https://github.com/swapkit/SwapKit/commit/5d334e69299e3aca21329ff71287498fed4d41a7) Thanks [@towanTG](https://github.com/towanTG)! - Removes microguard endpoint and improves midgard TNS handling

- Updated dependencies []:
  - @swapkit/tokens@4.0.5

## 4.0.4

### Patch Changes

- [#1460](https://github.com/swapkit/SwapKit/pull/1460) [`8d3a6a9`](https://github.com/swapkit/SwapKit/commit/8d3a6a975645f205dcb3c0711319d6405e759533) Thanks [@towanTG](https://github.com/towanTG)! - Small improvements to chainflip and mayachain plugin

- Updated dependencies []:
  - @swapkit/tokens@4.0.4

## 4.0.3

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.3

## 4.0.2

### Patch Changes

- [#1455](https://github.com/swapkit/SwapKit/pull/1455) [`bc7dc5a`](https://github.com/swapkit/SwapKit/commit/bc7dc5a01e65564aad8fa6745937254dfeaab699) Thanks [@towanTG](https://github.com/towanTG)! - Improves return of some midgard requests if 404 is coming from server

- Updated dependencies []:
  - @swapkit/tokens@4.0.2

## 4.0.1

### Patch Changes

- [#1454](https://github.com/swapkit/SwapKit/pull/1454) [`1d11e7f`](https://github.com/swapkit/SwapKit/commit/1d11e7fa5280aa5eb7d42df3f9e944d49b2c0d08) Thanks [@towanTG](https://github.com/towanTG)! - Adds network check before network switch for web3 wallets

- [#1448](https://github.com/swapkit/SwapKit/pull/1448) [`c1b3ac4`](https://github.com/swapkit/SwapKit/commit/c1b3ac42119519bc42b1f3949ae64b8710db995c) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Fix cycling dependencies & update biome to v2

- Updated dependencies [[`c1b3ac4`](https://github.com/swapkit/SwapKit/commit/c1b3ac42119519bc42b1f3949ae64b8710db995c)]:
  - @swapkit/contracts@4.0.1
  - @swapkit/tokens@4.0.1

## 4.0.0

### Major Changes

- [`0f2e55a`](https://github.com/swapkit/SwapKit/commit/0f2e55aba9efcdbfa74fcf9a4311534b9da780ed) Thanks [@towanTG](https://github.com/towanTG)! - Changes Tron Chain identifier from TRX to TRON

### Patch Changes

- [`cc7514f`](https://github.com/swapkit/SwapKit/commit/cc7514fa39cc2a0f91be28fe51415a56ac657ce5) Thanks [@towanTG](https://github.com/towanTG)! - Small fixes and zcash signer update

- [`c963338`](https://github.com/swapkit/SwapKit/commit/c96333881e81b8a14937dcde5f0d98c005981bb8) Thanks [@towanTG](https://github.com/towanTG)! - Exports near token list

- [#1426](https://github.com/swapkit/SwapKit/pull/1426) [`bd61ef7`](https://github.com/swapkit/SwapKit/commit/bd61ef7b0f5adf4f5a517b76d5988cb42bd002b2) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Update for new exports and usability

- [`3c3a3da`](https://github.com/swapkit/SwapKit/commit/3c3a3da284989bc6209fcd10af4b328d89a11b92) Thanks [@towanTG](https://github.com/towanTG)! - Exports midgard types

- [`52a6412`](https://github.com/swapkit/SwapKit/commit/52a6412c95e14430c33d66de09ef1242028442af) Thanks [@towanTG](https://github.com/towanTG)! - Moves generate tokenlist to token package

- [`3fdd6c3`](https://github.com/swapkit/SwapKit/commit/3fdd6c396f486a4cb9b1a84820cabef752e7904f) Thanks [@towanTG](https://github.com/towanTG)! - Adds general wallet error for locked state

- [#1404](https://github.com/swapkit/SwapKit/pull/1404) [`0c7a3a2`](https://github.com/swapkit/SwapKit/commit/0c7a3a24dbfdfe0562b838993f34ded4dbe573bc) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Server/Client split, type definitions and new goodies

- [`66d9b26`](https://github.com/swapkit/SwapKit/commit/66d9b2611b7eba507209c119a254b6cdd8d23197) Thanks [@towanTG](https://github.com/towanTG)! - Adds all midgard endpoint and updates Swapkit Api types

- [#1418](https://github.com/swapkit/SwapKit/pull/1418) [`a333581`](https://github.com/swapkit/SwapKit/commit/a333581318eeb6c8d47be567e84d1efaab790cc5) Thanks [@towanTG](https://github.com/towanTG)! - Add TronLink wallet integration

  - Add TRONLINK to WalletOption enum
  - Implement TronLink wallet connector with support for Tron chain
  - Use hybrid provider detection with `tronlink#initialized` event
  - Handle account and network change events
  - Implement robust error handling for user rejection
  - Add network verification during connection

- [`ec8cc57`](https://github.com/swapkit/SwapKit/commit/ec8cc5726d5adb9e9fbb07eab743de1d7bd64773) Thanks [@towanTG](https://github.com/towanTG)! - Updated Zcash transaction building to use bitgo package

- Updated dependencies [[`1ad81e7`](https://github.com/swapkit/SwapKit/commit/1ad81e76e6848a9e1ea8346da1b6ea8fab602436), [`c963338`](https://github.com/swapkit/SwapKit/commit/c96333881e81b8a14937dcde5f0d98c005981bb8), [`bd61ef7`](https://github.com/swapkit/SwapKit/commit/bd61ef7b0f5adf4f5a517b76d5988cb42bd002b2), [`52a6412`](https://github.com/swapkit/SwapKit/commit/52a6412c95e14430c33d66de09ef1242028442af), [`0c7a3a2`](https://github.com/swapkit/SwapKit/commit/0c7a3a24dbfdfe0562b838993f34ded4dbe573bc), [`e80a902`](https://github.com/swapkit/SwapKit/commit/e80a9027f28d0fc388a457a16526605b714fce65)]:
  - @swapkit/tokens@4.0.0
  - @swapkit/contracts@4.0.0

## 4.0.0-beta.50

### Patch Changes

- Updated dependencies [[`1ad81e7`](https://github.com/swapkit/SwapKit/commit/1ad81e76e6848a9e1ea8346da1b6ea8fab602436)]:
  - @swapkit/tokens@4.0.0-beta.18

## 4.0.0-beta.49

### Patch Changes

- [`cc7514f`](https://github.com/swapkit/SwapKit/commit/cc7514fa39cc2a0f91be28fe51415a56ac657ce5) Thanks [@towanTG](https://github.com/towanTG)! - Small fixes and zcash signer update

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.17

## 4.0.0-beta.48

### Patch Changes

- [`ec8cc57`](https://github.com/swapkit/SwapKit/commit/ec8cc5726d5adb9e9fbb07eab743de1d7bd64773) Thanks [@towanTG](https://github.com/towanTG)! - Updated Zcash transaction building to use bitgo package

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.16

## 4.0.0-beta.47

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.15

## 4.0.0-beta.46

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.14

## 4.0.0-beta.45

### Patch Changes

- [`c963338`](https://github.com/swapkit/SwapKit/commit/c96333881e81b8a14937dcde5f0d98c005981bb8) Thanks [@towanTG](https://github.com/towanTG)! - Exports near token list

- Updated dependencies [[`c963338`](https://github.com/swapkit/SwapKit/commit/c96333881e81b8a14937dcde5f0d98c005981bb8)]:
  - @swapkit/tokens@4.0.0-beta.13

## 4.0.0-beta.44

### Patch Changes

- Updated dependencies [[`e80a902`](https://github.com/swapkit/SwapKit/commit/e80a9027f28d0fc388a457a16526605b714fce65)]:
  - @swapkit/tokens@4.0.0-beta.12

## 4.0.0-beta.43

### Major Changes

- [`0f2e55a`](https://github.com/swapkit/SwapKit/commit/0f2e55aba9efcdbfa74fcf9a4311534b9da780ed) Thanks [@towanTG](https://github.com/towanTG)! - Changes Tron Chain identifier from TRX to TRON

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.11

## 4.0.0-beta.42

### Patch Changes

- [`3c3a3da`](https://github.com/swapkit/SwapKit/commit/3c3a3da284989bc6209fcd10af4b328d89a11b92) Thanks [@towanTG](https://github.com/towanTG)! - Exports midgard types

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.10

## 4.0.0-beta.41

### Patch Changes

- [#1426](https://github.com/swapkit/SwapKit/pull/1426) [`bd61ef7`](https://github.com/swapkit/SwapKit/commit/bd61ef7b0f5adf4f5a517b76d5988cb42bd002b2) Thanks [@ice-chillios](https://github.com/ice-chillios)! - Update for new exports and usability

- [`66d9b26`](https://github.com/swapkit/SwapKit/commit/66d9b2611b7eba507209c119a254b6cdd8d23197) Thanks [@towanTG](https://github.com/towanTG)! - Adds all midgard endpoint and updates Swapkit Api types

- Updated dependencies [[`bd61ef7`](https://github.com/swapkit/SwapKit/commit/bd61ef7b0f5adf4f5a517b76d5988cb42bd002b2)]:
  - @swapkit/tokens@4.0.0-beta.9

## 4.0.0-beta.40

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.8

## 4.0.0-beta.39

### Patch Changes

- [`3fdd6c3`](https://github.com/swapkit/SwapKit/commit/3fdd6c396f486a4cb9b1a84820cabef752e7904f) Thanks [@towanTG](https://github.com/towanTG)! - Adds general wallet error for locked state

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.7

## 4.0.0-beta.38

### Patch Changes

- [`52a6412`](https://github.com/swapkit/SwapKit/commit/52a6412c95e14430c33d66de09ef1242028442af) Thanks [@towanTG](https://github.com/towanTG)! - Moves generate tokenlist to token package

- Updated dependencies [[`52a6412`](https://github.com/swapkit/SwapKit/commit/52a6412c95e14430c33d66de09ef1242028442af)]:
  - @swapkit/tokens@4.0.0-beta.6

## 4.0.0-beta.37

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.5

## 4.0.0-beta.36

### Patch Changes

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.4

## 4.0.0-beta.35

### Patch Changes

- [#1418](https://github.com/swapkit/SwapKit/pull/1418) [`a333581`](https://github.com/swapkit/SwapKit/commit/a333581318eeb6c8d47be567e84d1efaab790cc5) Thanks [@towanTG](https://github.com/towanTG)! - Add TronLink wallet integration

  - Add TRONLINK to WalletOption enum
  - Implement TronLink wallet connector with support for Tron chain
  - Use hybrid provider detection with `tronlink#initialized` event
  - Handle account and network change events
  - Implement robust error handling for user rejection
  - Add network verification during connection

- Updated dependencies []:
  - @swapkit/tokens@4.0.0-beta.3

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
