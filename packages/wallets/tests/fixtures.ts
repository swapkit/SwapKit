import { Chain } from "@swapkit/helpers";
import type { KEYSTORE_SUPPORTED_CHAINS } from "../src/keystore";

export const testKeystoreAddresses: Record<(typeof KEYSTORE_SUPPORTED_CHAINS)[number], string> = {
  [Chain.Arbitrum]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.Avalanche]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.Base]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.BinanceSmartChain]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.BitcoinCash]: "qzhcfqxrnhcw88c433tq0fjlw0uut8c0e5d3cf8566",
  [Chain.Bitcoin]: "bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr",
  [Chain.Chainflip]: "cFPctKfXisvnrhss2eMV2VdiUNRm1F5pX4WfqkcT3ZrLKJXrS",
  [Chain.Cosmos]: "cosmos12d7d2rlxp7urkp8z0p8sft2fm07ewyjrfvul3f",
  [Chain.Dash]: "XoBBveBZv32rq9MMBt88QSVsUtdj9cMCLy",
  [Chain.Dogecoin]: "DPrKsuhVibyfMMYRmKP49US5PBQR8zq6v4",
  [Chain.Ethereum]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.Kujira]: "kujira12d7d2rlxp7urkp8z0p8sft2fm07ewyjrcy78ur",
  [Chain.Litecoin]: "ltc1qs4h7p8x0kfhs88wazmq2d40t59dwdlxd6rlpjz",
  [Chain.Maya]: "maya1hm0sdz9v2h5jwjuu0ssp8x98upvlc6py2t7e6j",
  [Chain.Optimism]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.Polkadot]: "16kQVedQo7yYoFSp2MnQ78zP39xWnFGePnZps2APEyt9K9KZ",
  [Chain.Polygon]: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
  [Chain.Ripple]: "rhDQXdwWR2RstC7sLjLMbjCeWT3PuSAZVu",
  // [Chain.Radix]: "16kQVedQo7yYoFSp2MnQ78zP39xWnFGePnZps2APEyt9K9KZ",
  [Chain.Solana]: "4UHWuPwyV3XCcnwrpEdWAEW3WLUP1RDMaK3ANNsRUjfM",
  [Chain.THORChain]: "thor1hm0sdz9v2h5jwjuu0ssp8x98upvlc6py2uq4vz",
  [Chain.Tron]: "THr473cZqHwBLEmTWUUR1WTotxijWWbRGD",
};

export const testKeystoreWalletData = {
  addresses: testKeystoreAddresses,
};
