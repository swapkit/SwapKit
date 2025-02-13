import { Registry } from "@cosmjs/proto-signing";
import { AminoTypes, defaultRegistryTypes } from "@cosmjs/stargate";
import { Chain } from "@swapkit/helpers";
import * as types from "../thorchainUtils/types/proto/MsgCompiled";
import { base64ToBech32, bech32ToBase64 } from "./addressFormat";

export const createDefaultRegistry = () => {
  return new Registry([
    ...defaultRegistryTypes,
    ["/types.MsgSend", { ...types.default.types.MsgSend }],
    ["/types.MsgDeposit", { ...types.default.types.MsgDeposit }],
  ]);
};

export const createDefaultAminoTypes = (chain: Chain.THORChain | Chain.Maya) => {
  return new AminoTypes({
    "/types.MsgSend": {
      aminoType: `${chain === Chain.Maya ? "mayachain" : "thorchain"}/MsgSend`,
      toAmino: (params: any) => ({
        from_address: base64ToBech32(params.fromAddress),
        to_address: base64ToBech32(params.toAddress),
        amount: [...params.amount],
      }),
      fromAmino: (params: any) => ({
        fromAddress: bech32ToBase64(params.from_address),
        toAddress: bech32ToBase64(params.to_address),
        amount: [...params.amount],
      }),
    },
    "/types.MsgDeposit": {
      aminoType: `${chain === Chain.Maya ? "mayachain" : "thorchain"}/MsgDeposit`,
      toAmino: (params: any) => ({
        signer: base64ToBech32(params.signer),
        memo: params.memo,
        coins: [...params.coins],
      }),
      fromAmino: (params: any) => ({
        signer: bech32ToBase64(params.signer),
        memo: params.memo,
        coins: [...params.coins],
      }),
    },
  });
};
