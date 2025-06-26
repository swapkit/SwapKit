import { Chain } from "@swapkit/helpers";
import { base64ToBech32, bech32ToBase64 } from "./addressFormat";

export async function createDefaultRegistry() {
  const { $root } = await import("./types/MsgCompiled");
  const { Registry } = await import("@cosmjs/proto-signing");
  const { defaultRegistryTypes } = await import("@cosmjs/stargate");

  return new Registry([
    ...defaultRegistryTypes,
    ["/types.MsgSend", $root.types.MsgSend],
    ["/types.MsgDeposit", $root.types.MsgDeposit],
  ]);
}

export async function createDefaultAminoTypes(chain: Chain.THORChain | Chain.Maya) {
  const { AminoTypes } = await import("@cosmjs/stargate");
  const aminoTypePrefix = chain === Chain.THORChain ? "thorchain" : "mayachain";

  return new AminoTypes({
    "/types.MsgSend": {
      aminoType: `${aminoTypePrefix}/MsgSend`,
      toAmino: ({ fromAddress, toAddress, ...rest }: any) => ({
        ...rest,
        from_address: base64ToBech32(fromAddress),
        to_address: base64ToBech32(toAddress),
      }),
      fromAmino: ({ from_address, to_address, ...rest }: any) => ({
        ...rest,
        fromAddress: bech32ToBase64(from_address),
        toAddress: bech32ToBase64(to_address),
      }),
    },
    "/types.MsgDeposit": {
      aminoType: `${aminoTypePrefix}/MsgDeposit`,
      toAmino: ({ signer, ...rest }: any) => ({ ...rest, signer: base64ToBech32(signer) }),
      fromAmino: ({ signer, ...rest }: any) => ({ ...rest, signer: bech32ToBase64(signer) }),
    },
  });
}
