import { Chain, type EVMChain, FeeOption, getRPCUrl } from "@swapkit/helpers";
import { match, P } from "ts-pattern";

import { getEvmApi } from "../api";
import { multicallAbi } from "../contracts/eth/multicall";
import { getIsEIP1559Compatible, getNetworkParams, getProvider } from "../helpers";
import type { EVMToolboxParams } from "../types";
import { BaseEVMToolbox } from "./baseEVMToolbox";

export async function ETHToolbox({ provider, ...signer }: EVMToolboxParams) {
  const evmToolbox = await createEvmToolbox(Chain.Ethereum)({ provider, ...signer });
  async function multicall(
    callTuples: { address: string; data: string }[],
    multicallAddress = "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
    funcName = "aggregate",
    feeOptionKey: FeeOption = FeeOption.Fast,
  ) {
    const txObject = await evmToolbox.createContractTxObject({
      abi: multicallAbi,
      contractAddress: multicallAddress,
      funcName,
      funcParams: [callTuples],
    });

    return evmToolbox.sendTransaction({ ...txObject, feeOptionKey });
  }

  return { ...evmToolbox, multicall };
}

export const ARBToolbox = createEvmToolbox(Chain.Arbitrum);
export const AURORAToolbox = createEvmToolbox(Chain.Aurora);
export const AVAXToolbox = createEvmToolbox(Chain.Avalanche);
export const BASEToolbox = createEvmToolbox(Chain.Base);
export const BERAToolbox = createEvmToolbox(Chain.Berachain);
export const BSCToolbox = createEvmToolbox(Chain.BinanceSmartChain);
export const BotanixToolbox = createEvmToolbox(Chain.Botanix);
export const COREToolbox = createEvmToolbox(Chain.Core);
export const CORNToolbox = createEvmToolbox(Chain.Corn);
export const CROToolbox = createEvmToolbox(Chain.Cronos);
export const GNOToolbox = createEvmToolbox(Chain.Gnosis);
export const HYPEREVMToolbox = createEvmToolbox(Chain.Hyperevm);
export const MATICToolbox = createEvmToolbox(Chain.Polygon);
export const SONICToolbox = createEvmToolbox(Chain.Sonic);
export const UNIToolbox = createEvmToolbox(Chain.Unichain);
export const XLayerToolbox = createEvmToolbox(Chain.XLayer);
export const MONADToolbox = createEvmToolbox(Chain.Monad);
export const MEGAETHToolbox = createEvmToolbox(Chain.MegaETH as EVMChain);

function createEvmToolbox<C extends EVMChain>(chain: C) {
  return async function createEvmToolbox({ provider: providerParam, ...toolboxSignerParams }: EVMToolboxParams) {
    const { HDNodeWallet } = await import("ethers");
    const rpcUrl = await getRPCUrl(chain);

    const provider = providerParam || (await getProvider(chain, rpcUrl));

    const isEIP1559Compatible = getIsEIP1559Compatible(chain);
    const signer = match(toolboxSignerParams)
      .with({ phrase: P.string }, ({ phrase }) => HDNodeWallet.fromPhrase(phrase).connect(provider))
      .with({ signer: P.any }, ({ signer }) => signer)
      .otherwise(() => undefined);

    const evmToolbox = BaseEVMToolbox({ chain, isEIP1559Compatible, provider, signer });

    return { ...evmToolbox, getBalance: getEvmApi(chain).getBalance, getNetworkParams: getNetworkParams(chain) };
  };
}
