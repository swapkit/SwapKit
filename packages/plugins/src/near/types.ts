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
