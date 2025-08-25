export type NearAccountInfo = {
  accountId: string;
  balance: string;
  storageUsed: number;
  codeHash: string;
  publicKeys: string[];
};

export type NearNameRegistrationParams = { name: string; publicKey?: string };
