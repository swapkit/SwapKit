import type { AddChainType, Chain, WalletOption } from "@swapkit/helpers";

export function createWallet<
  ConnectParams extends any[],
  SupportedChains extends Chain[],
  const Name extends string,
  WalletType extends WalletOption,
>({
  connect,
  name,
  supportedChains,
  walletType,
}: {
  connect: (connectParams: {
    addChain: AddChainType;
    walletType: WalletType;
    supportedChains: SupportedChains;
  }) => (...params: ConnectParams) => Promise<boolean>;
  name: Name;
  supportedChains: SupportedChains;
  walletType?: WalletType | string;
}) {
  function connectWallet(connectParams: { addChain: AddChainType }) {
    return connect({ ...connectParams, supportedChains, walletType: walletType as WalletType });
  }

  return { [name]: { connectWallet, supportedChains } } as unknown as {
    [key in Name]: { connectWallet: typeof connectWallet; supportedChains: SupportedChains };
  };
}

export function getWalletSupportedChains<T extends ReturnType<typeof createWallet<any, any, any, any>>>(
  wallet: T,
): T[keyof T]["supportedChains"] {
  const walletName = Object.keys(wallet)?.[0] || "";
  return wallet?.[walletName]?.supportedChains || [];
}
