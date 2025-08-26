import type { ChainInfo } from "@keplr-wallet/types";
import { ChainId } from "@swapkit/helpers";

export const chainRegistry = new Map<ChainId, ChainInfo>([
  [
    ChainId.KUJI,
    {
      bech32Config: {
        bech32PrefixAccAddr: "kujira",
        bech32PrefixAccPub: "kujirapub",
        bech32PrefixConsAddr: "kujiravalcons",
        bech32PrefixConsPub: "kujiravalconspub",
        bech32PrefixValAddr: "kujiravaloper",
        bech32PrefixValPub: "kujiravaloperpub",
      },
      bip44: { coinType: 118 },
      chainId: "kaiyo-1",
      chainName: "Kujira",
      chainSymbolImageUrl:
        "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/kaiyo/chain.png",
      currencies: [
        {
          coinDecimals: 6,
          coinDenom: "KUJI",
          coinGeckoId: "kujira",
          coinImageUrl: "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/kaiyo/ukuji.png",
          coinMinimalDenom: "ukuji",
        },
        {
          coinDecimals: 6,
          coinDenom: "USK",
          coinGeckoId: "usk",
          coinMinimalDenom: "factory/kujira1qk00h5atutpsv900x202pxx42npjr9thg58dnqpa72f2p7m2luase444a7/uusk",
        },
        {
          coinDecimals: 6,
          coinDenom: "MNTA",
          coinGeckoId: "mantadao",
          coinMinimalDenom: "factory/kujira1643jxg8wasy5cfcn7xm8rd742yeazcksqlg4d7/umnta",
        },
        {
          coinDecimals: 6,
          coinDenom: "bKUJI",
          coinImageUrl:
            "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/kaiyo/factory/kujira15e8q5wzlk5k38gjxlhse3vu6vqnafysncx2ltexd6y9gx50vuj2qpt7dgv/bKUJI.png",
          coinMinimalDenom: "factory/kujira15e8q5wzlk5k38gjxlhse3vu6vqnafysncx2ltexd6y9gx50vuj2qpt7dgv/boneKuji",
        },
        {
          coinDecimals: 6,
          coinDenom: "AQLA",
          coinGeckoId: "aqualibre",
          coinImageUrl:
            "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/kaiyo/factory/kujira1xe0awk5planmtsmjel5xtx2hzhqdw5p8z66yqd/AQLA.png",
          coinMinimalDenom: "factory/kujira1xe0awk5planmtsmjel5xtx2hzhqdw5p8z66yqd/uaqla",
        },
      ],
      features: ["cosmwasm"],
      feeCurrencies: [
        {
          coinDecimals: 6,
          coinDenom: "KUJI",
          coinGeckoId: "kujira",
          coinImageUrl: "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/kaiyo/ukuji.png",
          coinMinimalDenom: "ukuji",
        },
        {
          coinDecimals: 6,
          coinDenom: "USK",
          coinGeckoId: "usk",
          coinMinimalDenom: "factory/kujira1qk00h5atutpsv900x202pxx42npjr9thg58dnqpa72f2p7m2luase444a7/uusk",
        },
        {
          coinDecimals: 6,
          coinDenom: "axlUSDC",
          coinGeckoId: "usd-coin",
          coinMinimalDenom: "ibc/295548A78785A1007F232DE286149A6FF512F180AF5657780FC89C009E2C348F",
        },
        {
          coinDecimals: 6,
          coinDenom: "ATOM",
          coinGeckoId: "cosmos",
          coinMinimalDenom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
        },
        {
          coinDecimals: 6,
          coinDenom: "OSMO",
          coinGeckoId: "osmosis",
          coinMinimalDenom: "ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23",
        },
        {
          coinDecimals: 6,
          coinDenom: "CMDX",
          coinGeckoId: "comdex",
          coinMinimalDenom: "ibc/3607EB5B5E64DD1C0E12E07F077FF470D5BC4706AFCBC98FE1BA960E5AE4CE07",
        },
        {
          coinDecimals: 6,
          coinDenom: "EVMOS",
          coinGeckoId: "evmos",
          coinMinimalDenom: "ibc/F3AA7EF362EC5E791FE78A0F4CCC69FEE1F9A7485EB1A8CAB3F6601C00522F10",
        },
        {
          coinDecimals: 6,
          coinDenom: "JUNO",
          coinGeckoId: "juno-network",
          coinMinimalDenom: "ibc/EFF323CC632EC4F747C61BCE238A758EFDB7699C3226565F7C20DA06509D59A5",
        },
        {
          coinDecimals: 6,
          coinDenom: "MNTA",
          coinGeckoId: "mantadao",
          coinMinimalDenom: "factory/kujira1643jxg8wasy5cfcn7xm8rd742yeazcksqlg4d7/umnta",
        },
        {
          coinDecimals: 6,
          coinDenom: "SCRT",
          coinGeckoId: "secret",
          coinMinimalDenom: "ibc/A358D7F19237777AF6D8AD0E0F53268F8B18AE8A53ED318095C14D6D7F3B2DB5",
        },
        {
          coinDecimals: 6,
          coinDenom: "STARS",
          coinGeckoId: "stargaze",
          coinMinimalDenom: "ibc/4F393C3FCA4190C0A6756CE7F6D897D5D1BE57D6CCB80D0BC87393566A7B6602",
        },
        {
          coinDecimals: 18,
          coinDenom: "wAVAX",
          coinGeckoId: "avalanche-2",
          coinMinimalDenom: "ibc/004EBF085BBED1029326D56BE8A2E67C08CECE670A94AC1947DF413EF5130EB2",
        },
        {
          coinDecimals: 18,
          coinDenom: "wETH",
          coinGeckoId: "ethereum",
          coinMinimalDenom: "ibc/1B38805B1C75352B28169284F96DF56BDEBD9E8FAC005BDCC8CF0378C82AA8E7",
        },
      ],
      nodeProvider: { email: "pfc-validator@protonmail.com", name: "PFC", website: "https://pfc.zone/" },
      rest: "https://rest.cosmos.directory/kujira/",
      rpc: "https://kujira-rpc.nodes.defiantlabs.net",
      stakeCurrency: {
        coinDecimals: 6,
        coinDenom: "KUJI",
        coinGeckoId: "kujira",
        coinImageUrl: "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/kaiyo/ukuji.png",
        coinMinimalDenom: "ukuji",
      },
    },
  ],
  [
    ChainId.NOBLE,
    {
      bech32Config: {
        bech32PrefixAccAddr: "noble",
        bech32PrefixAccPub: "noblepub",
        bech32PrefixConsAddr: "noblevalcons",
        bech32PrefixConsPub: "noblevalconspub",
        bech32PrefixValAddr: "noblevaloper",
        bech32PrefixValPub: "noblevaloperpub",
      },
      bip44: { coinType: 118 },
      chainId: "noble-1",
      chainName: "Noble",
      chainSymbolImageUrl:
        "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/chain.png",
      currencies: [
        {
          coinDecimals: 6,
          coinDenom: "USDC",
          coinGeckoId: "usd-coin",
          coinImageUrl: "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/uusdc.png",
          coinMinimalDenom: "uusdc",
        },
        { coinDecimals: 6, coinDenom: "USDN", coinGeckoId: "usd-coin", coinMinimalDenom: "uusdn" },
      ],
      features: ["cosmwasm"],
      feeCurrencies: [
        {
          coinDecimals: 6,
          coinDenom: "USDC",
          coinGeckoId: "usd-coin",
          coinImageUrl: "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/uusdc.png",
          coinMinimalDenom: "uusdc",
        },
        {
          coinDecimals: 6,
          coinDenom: "USDN",
          coinGeckoId: "usd-coin",
          coinMinimalDenom:
            "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/uusdn.png",
        },
      ],
      rest: "https://lcd-noble.keplr.app",
      rpc: "https://rpc-noble.keplr.app",
    },
  ],
  [
    ChainId.THOR,
    {
      bech32Config: {
        bech32PrefixAccAddr: "thor",
        bech32PrefixAccPub: "thorpub",
        bech32PrefixConsAddr: "thorvalcons",
        bech32PrefixConsPub: "thorvalconspub",
        bech32PrefixValAddr: "thorvaloper",
        bech32PrefixValPub: "thorvaloperpub",
      },
      bip44: { coinType: 931 },
      chainId: "thorchain-1",
      chainName: "THORChain",
      chainSymbolImageUrl:
        "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/thorchain/chain.png",
      currencies: [
        {
          coinDecimals: 8,
          coinDenom: "RUNE",
          coinGeckoId: "thorchain",
          coinImageUrl:
            "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/thorchain/rune.png",
          coinMinimalDenom: "rune",
        },
      ],
      features: [],
      feeCurrencies: [
        {
          coinDecimals: 8,
          coinDenom: "RUNE",
          coinGeckoId: "thorchain",
          coinImageUrl:
            "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/thorchain/rune.png",
          coinMinimalDenom: "rune",
          gasPriceStep: { average: 0.02, high: 0.03, low: 0.02 },
        },
      ],
      rest: "https://lcd-thorchain.keplr.app",
      rpc: "https://rpc-thorchain.keplr.app",
    },
  ],
]);
