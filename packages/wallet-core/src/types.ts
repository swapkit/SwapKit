import type { AddChainType, Chain, WalletOption } from "@swapkit/helpers";

export type ConnectFunction<
  ConnectParams extends any[],
  SupportedChains extends Chain[],
  WalletType extends WalletOption,
> = (connectParams: {
  addChain: AddChainType;
  walletType: WalletType;
  supportedChains: SupportedChains;
}) => (...params: ConnectParams) => Promise<boolean>;

export type CreateFunction<
  CreateParams extends any[],
  WalletType extends WalletOption,
  Wallets extends Record<Chain, any>,
> = (createParams: { walletType: WalletType }) => (...params: CreateParams) => Promise<Wallets> | Wallets;
