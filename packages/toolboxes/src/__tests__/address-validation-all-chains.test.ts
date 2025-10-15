import { beforeAll, describe, expect, test } from "bun:test";
import { Chain } from "@swapkit/helpers";
import { getAddressValidator } from "../index";

const context: { validateAddress: (params: { address: string; chain: Chain }) => boolean } = {} as any;

beforeAll(async () => {
  context.validateAddress = await getAddressValidator();
});

describe("Address Validation - All Chains", () => {
  describe("Valid addresses for each chain", () => {
    const validAddresses = {
      [Chain.Ethereum]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.Avalanche]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.Arbitrum]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.BinanceSmartChain]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.Optimism]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.Polygon]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.Base]: ["0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0"],
      [Chain.Bitcoin]: ["bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
      [Chain.BitcoinCash]: ["qzhcfqxrnhcw88c433tq0fjlw0uut8c0e5d3cf8566"],
      [Chain.Dogecoin]: ["DPrKsuhVibyfMMYRmKP49US5PBQR8zq6v4"],
      [Chain.Litecoin]: ["ltc1qs4h7p8x0kfhs88wazmq2d40t59dwdlxd6rlpjz"],
      [Chain.Dash]: ["XoBBveBZv32rq9MMBt88QSVsUtdj9cMCLy"],
      [Chain.Zcash]: ["t1Mh7QW9g1gK94CSRxniD49aLAJ67s6UerX"],
      [Chain.Cosmos]: ["cosmos12d7d2rlxp7urkp8z0p8sft2fm07ewyjrfvul3f"],
      [Chain.Kujira]: ["kujira12d7d2rlxp7urkp8z0p8sft2fm07ewyjrcy78ur"],
      [Chain.Maya]: ["maya1hm0sdz9v2h5jwjuu0ssp8x98upvlc6py2t7e6j"],
      [Chain.Noble]: ["noble12d7d2rlxp7urkp8z0p8sft2fm07ewyjrp0fhf8"],
      [Chain.THORChain]: ["thor1hm0sdz9v2h5jwjuu0ssp8x98upvlc6py2uq4vz"],
      [Chain.Polkadot]: ["16kQVedQo7yYoFSp2MnQ78zP39xWnFGePnZps2APEyt9K9KZ"],
      [Chain.Chainflip]: ["cFPctKfXisvnrhss2eMV2VdiUNRm1F5pX4WfqkcT3ZrLKJXrS"],
      [Chain.Cardano]: [
        "addr1qxk2md7wufs2cas0dfxch0uu59079s7yc5k9pw8s49wpm25s8ynu4svqm7m4hd04d4jvm6e5vvyw7dm4gvpqyfklgn8qetu85s",
      ],
      [Chain.Near]: ["a03fafdf5f97d3c6be6bff9e55f057dda76fefbb7e149f5469248f41e812cb6e"],
      [Chain.Ripple]: ["rhDQXdwWR2RstC7sLjLMbjCeWT3PuSAZVu"],
      [Chain.Solana]: ["4UHWuPwyV3XCcnwrpEdWAEW3WLUP1RDMaK3ANNsRUjfM"],
      [Chain.Sui]: ["0x57b861db681d8e47b586e6e9a92f6ed210dbbb440670b8122420848cf0e844fb"],
      [Chain.Ton]: ["EQCC1GV4iL5EkQqICYshf3AF7ESbceCYhVK-go1SkOMOBTNE"],
      [Chain.Radix]: [] as string[],
      [Chain.Harbor]: [] as string[],
    };

    for (const [chain, addresses] of Object.entries(validAddresses)) {
      if (addresses.length === 0) continue;

      test(`should validate valid ${chain} addresses`, () => {
        for (const address of addresses) {
          const result = context.validateAddress({ address, chain: chain as Chain });
          expect(result).toBe(true);
        }
      });
    }
  });

  describe("Invalid addresses should be rejected", () => {
    const invalidTestCases: Array<{ chain: Chain; addresses: string[] }> = [
      {
        addresses: [
          "",
          "invalid",
          "0x123",
          "0xG051176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
          "THr473cZqHwBLEmTWUUR1WTotxijWWbRGD",
          "bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr",
          "cosmos12d7d2rlxp7urkp8z0p8sft2fm07ewyjrfvul3f",
        ],
        chain: Chain.Ethereum,
      },
      {
        addresses: [
          "",
          "invalid",
          "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
          "THr473cZqHwBLEmTWUUR1WTotxijWWbRGD",
          "cosmos12d7d2rlxp7urkp8z0p8sft2fm07ewyjrfvul3f",
          "qzhcfqxrnhcw88c433tq0fjlw0uut8c0e5d3cf8566",
        ],
        chain: Chain.Bitcoin,
      },
      {
        addresses: [
          "",
          "invalid",
          "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
          "bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr",
          "thor1hm0sdz9v2h5jwjuu0ssp8x98upvlc6py2uq4vz",
          "maya1hm0sdz9v2h5jwjuu0ssp8x98upvlc6py2t7e6j",
        ],
        chain: Chain.Cosmos,
      },
      {
        addresses: [
          "",
          "invalid",
          "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
          "4UHWuPwyV3XCcnwrpEdWAEW3WLUP1RDMaK3ANNsRUjfM123",
          "123",
        ],
        chain: Chain.Solana,
      },
      { addresses: ["", "invalid!"], chain: Chain.Near },
      {
        addresses: [
          "",
          "invalid",
          "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
          "bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr",
        ],
        chain: Chain.Cardano,
      },
      {
        addresses: [
          "",
          "invalid",
          "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0",
          "bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr",
        ],
        chain: Chain.Ripple,
      },
    ];

    for (const { chain, addresses } of invalidTestCases) {
      test(`should reject invalid ${chain} addresses`, () => {
        for (const address of addresses) {
          const result = context.validateAddress({ address, chain });
          expect(result).toBe(false);
        }
      });
    }
  });

  describe("Edge cases and type safety", () => {
    test("should handle non-string inputs safely", () => {
      const edgeCases = [null, undefined, 123, {}, [], true, false];

      for (const testCase of edgeCases) {
        expect(context.validateAddress({ address: testCase as any, chain: Chain.Ethereum })).toBe(false);
      }
    });

    test("should reject cross-chain address usage", () => {
      expect(
        context.validateAddress({ address: "0x51176f5F0B7ccC8fA0376F08aaa28F316A38a2a0", chain: Chain.Bitcoin }),
      ).toBe(false);

      expect(
        context.validateAddress({ address: "bc1qjpmp8xvg9k4ysa7nvev3lw7qcclvxzt2ex75kr", chain: Chain.Ethereum }),
      ).toBe(false);

      expect(
        context.validateAddress({ address: "cosmos12d7d2rlxp7urkp8z0p8sft2fm07ewyjrfvul3f", chain: Chain.Maya }),
      ).toBe(false);

      expect(context.validateAddress({ address: "THr473cZqHwBLEmTWUUR1WTotxijWWbRGD", chain: Chain.Ethereum })).toBe(
        false,
      );
    });
  });
});
