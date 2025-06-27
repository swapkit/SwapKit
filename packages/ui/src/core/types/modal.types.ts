export interface ModalState {
  activeModal: ModalType | null;
  tokenSelectFor?: "input" | "output";
  modalData?: unknown;
}

export enum ModalType {
  CONNECT_WALLET = "connectWallet",
  TOKEN_SELECT = "tokenSelect",
  CONFIRM_SWAP = "confirmSwap",
  TRANSACTION_STATUS = "transactionStatus",
  SETTINGS = "settings",
  PROVIDER_SELECT = "providerSelect",
}
