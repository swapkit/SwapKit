export type NearTokenInfo = {
  address: string;
  chainId: number;
  decimals: number;
  identifier: string;
  ticker: string;
};

export type NearSwapRoute = {
  amount: string;
  dstToken: NearTokenInfo;
  srcToken: NearTokenInfo;
};

export type NearDepositChannelParams = {
  amount: string;
  blockNumber: number;
  fromAddress: string;
  srcToken?: string;
  toAddress: string;
  affiliate?: string;
  affiliateFee?: number;
  channelId?: string;
  chainId?: number;
  dstChain?: string;
  dstToken?: string;
  isAffiliateFeeFlat?: boolean;
  srcChain?: string;
  txnMetadata?: string;
};

export type NearSwapResponse = {
  amount: {
    deposit: string;
    estimatedOutput: string;
  };
  dstChain: string;
  dstToken: string;
  estimatedWaitTime: {
    deposit: string;
    swap: string;
  };
  isSuccess: boolean;
  response: {
    channelId: string;
    depositAddress: string;
    depositChannelBrokerCommissionBps: string;
    estimatedDepositChannelExpiryTime: number;
    issuedBlock: number;
    maxBoostFeeBps: number;
    srcChainExpiryBlock: string;
  };
  srcChain: string;
  srcToken: string;
};

export type NearNameInfo = {
  owner: string;
  price?: string;
  expiresAt?: string;
  registeredAt?: string;
};

export type NearNameRegistrationParams = {
  name: string;
  publicKey?: string;
};
