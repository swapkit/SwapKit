import { Chain, type TCLikeChain } from "@swapkit/helpers";
import { base64ToBech32, bech32ToBase64 } from "./addressFormat";

export async function createDefaultRegistry() {
  const { $root } = await import("./types/MsgCompiled");
  const importedProtoSigning = await import("@cosmjs/proto-signing");
  const Registry = importedProtoSigning.Registry ?? importedProtoSigning.default?.Registry;
  const importedStargate = await import("@cosmjs/stargate");
  const defaultRegistryTypes = importedStargate.defaultRegistryTypes ?? importedStargate.default?.defaultRegistryTypes;

  return new Registry([
    ...defaultRegistryTypes,
    ["/types.MsgSend", $root.types.MsgSend],
    ["/types.MsgDeposit", $root.types.MsgDeposit],
  ]);
}

export async function createDefaultAminoTypes(chain: TCLikeChain) {
  const imported = await import("@cosmjs/stargate");
  const AminoTypes = imported.AminoTypes ?? imported.default?.AminoTypes;
  const aminoTypePrefix = chain === Chain.THORChain ? "thorchain" : ("mayachain" as const);

  return new AminoTypes({
    "/types.MsgDeposit": {
      aminoType: `${aminoTypePrefix}/MsgDeposit`,
      fromAmino: ({ signer, ...rest }: any) => ({ ...rest, signer: bech32ToBase64(signer) }),
      toAmino: ({ signer, ...rest }: any) => ({ ...rest, signer: base64ToBech32(signer) }),
    },
    "/types.MsgSend": {
      aminoType: `${aminoTypePrefix}/MsgSend`,
      fromAmino: ({ from_address, to_address, ...rest }: any) => ({
        ...rest,
        fromAddress: bech32ToBase64(from_address),
        toAddress: bech32ToBase64(to_address),
      }),
      toAmino: ({ fromAddress, toAddress, ...rest }: any) => ({
        ...rest,
        from_address: base64ToBech32(fromAddress),
        to_address: base64ToBech32(toAddress),
      }),
    },
  });
}
