import { decodeAddress } from "@polkadot/keyring";
import { isHex, u8aToHex } from "@polkadot/util";
import { AssetValue, Chain, SwapKitError, wrapWithThrow } from "@swapkit/helpers";
import type { getEvmToolbox } from "@swapkit/toolboxes/evm";
import type { getSubstrateToolbox } from "@swapkit/toolboxes/substrate";

import type { WithdrawFeeResponse } from "./types";

type ChainflipToolbox = Awaited<ReturnType<typeof getSubstrateToolbox<Chain.Chainflip>>>;

export const assetIdentifierToChainflipTicker = new Map<string, string>([
  ["ARB.ETH", "ArbEth"],
  ["ARB.USDC-0XAF88D065E77C8CC2239327C5EDB3A432268E5831", "ArbUsdc"],
  ["BTC.BTC", "Btc"],
  ["DOT.DOT", "Dot"],
  ["ETH.ETH", "Eth"],
  ["ETH.FLIP-0X826180541412D574CF1336D22C0C0A287822678A", "Flip"],
  ["ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48", "Usdc"],
  ["ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7", "Usdt"],
  ["SOL.SOL", "Sol"],
  ["SOL.USDC-EPJFWDD5AUFQSSQEM2QN1XZYBAPC8G4WEGGKZWYTDT1V", "SolUsdc"],
]);

const registerAsBroker = (toolbox: ChainflipToolbox) => () => {
  const extrinsic = toolbox.api.tx.swapping?.registerAsBroker?.();

  if (!extrinsic) {
    throw new SwapKitError("chainflip_broker_register");
  }

  return toolbox.signAndBroadcast({ tx: extrinsic, address: toolbox.getAddress() });
};

const withdrawFee =
  (toolbox: ChainflipToolbox) =>
  ({ feeAsset, recipient }: { feeAsset: AssetValue; recipient: string }) => {
    const isFeeChainPolkadot = feeAsset.chain === Chain.Polkadot;

    const recipientAddress = wrapWithThrow(() => {
      return isFeeChainPolkadot
        ? toolbox.encodeAddress(toolbox.decodeAddress(recipient), "hex")
        : recipient;
    }, "chainflip_broker_recipient_error");

    return new Promise<WithdrawFeeResponse>((resolve) => {
      const extrinsic = toolbox.api.tx?.swapping?.withdraw?.(feeAsset.ticker.toLowerCase(), {
        [feeAsset.chain.toLowerCase()]: recipientAddress,
      });

      if (!extrinsic) {
        throw new SwapKitError("chainflip_broker_withdraw");
      }

      toolbox.signAndBroadcast({
        tx: extrinsic,
        callback: async (result) => {
          if (!result.status?.isFinalized) {
            return;
          }

          const withdrawEvent = result.events.find(
            (event) => event.event.method === "WithdrawalRequested",
          );

          if (!withdrawEvent) {
            throw new SwapKitError(
              "chainflip_channel_error",
              "Could not find 'WithdrawalRequested' event",
            );
          }
          const {
            event: {
              data: { egressId, egressAsset, egressAmount, egressFee, destinationAddress },
            },
          } = withdrawEvent.toHuman() as any;
          resolve({
            egressId,
            egressAsset,
            egressAmount,
            egressFee,
            destinationAddress,
          });
        },
      });
    });
  };

const fundStateChainAccount =
  (chainflipToolbox: ChainflipToolbox) =>
  async ({
    evmToolbox,
    stateChainAccount,
    assetValue,
  }: {
    evmToolbox: Awaited<ReturnType<typeof getEvmToolbox>>;
    stateChainAccount: string;
    assetValue: AssetValue;
  }) => {
    const { chainflipGateway } = await import("@swapkit/helpers/contracts");

    const flipAssetValue = AssetValue.from({ asset: "ETH.FLIP" });

    if (!assetValue.eqAsset(flipAssetValue)) {
      throw new SwapKitError("chainflip_broker_fund_only_flip_supported");
    }

    if (!chainflipToolbox.validateAddress(stateChainAccount)) {
      throw new SwapKitError("chainflip_broker_fund_invalid_address");
    }

    const hexAddress = isHex(stateChainAccount)
      ? stateChainAccount
      : u8aToHex(decodeAddress(stateChainAccount));

    return evmToolbox.call<string>({
      abi: chainflipGateway,
      contractAddress: "0x6995ab7c4d7f4b03f467cf4c8e920427d9621dbd",
      funcName: "fundStateChainAccount",
      funcParams: [hexAddress, assetValue.getBaseValue("string")],
    });
  };

export const ChainflipBroker = (chainflipToolbox: ChainflipToolbox) => ({
  registerAsBroker: registerAsBroker(chainflipToolbox),
  fundStateChainAccount: fundStateChainAccount(chainflipToolbox),
  withdrawFee: withdrawFee(chainflipToolbox),
});
