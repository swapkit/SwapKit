const errorCodes = {
  /**
   * Core
   */
  core_estimated_max_spendable_chain_not_supported: 10002,
  core_extend_error: 10003,
  core_inbound_data_not_found: 10004,
  core_approve_asset_address_or_from_not_found: 10005,
  core_plugin_not_found: 10006,
  core_plugin_swap_not_found: 10007,
  core_approve_asset_target_invalid: 10008,
  core_explorer_unsupported_chain: 10009,
  core_verify_message_not_supported: 10010,
  core_chain_halted: 10099,
  /**
   * Core - Wallet
   */
  core_wallet_connection_not_found: 10100,
  core_wallet_ctrl_not_installed: 10101,
  core_wallet_evmwallet_not_installed: 10102,
  core_wallet_walletconnect_not_installed: 10103,
  core_wallet_keystore_not_installed: 10104,
  core_wallet_ledger_not_installed: 10105,
  core_wallet_trezor_not_installed: 10106,
  core_wallet_keplr_not_installed: 10107,
  core_wallet_okx_not_installed: 10108,
  core_wallet_keepkey_not_installed: 10109,
  core_wallet_talisman_not_installed: 10110,
  core_wallet_not_keypair_wallet: 10111,
  core_wallet_sign_message_not_supported: 10110,
  /**
   * Core - Swap
   */
  core_swap_invalid_params: 10200,
  core_swap_route_not_complete: 10201,
  core_swap_asset_not_recognized: 10202,
  core_swap_contract_not_found: 10203,
  core_swap_route_transaction_not_found: 10204,
  core_swap_contract_not_supported: 10205,
  core_swap_transaction_error: 10206,
  core_swap_quote_mode_not_supported: 10207,
  /**
   * Core - Transaction
   */
  core_transaction_deposit_error: 10301,
  core_transaction_create_liquidity_base_error: 10302,
  core_transaction_create_liquidity_asset_error: 10303,
  core_transaction_create_liquidity_invalid_params: 10304,
  core_transaction_add_liquidity_invalid_params: 10305,
  core_transaction_add_liquidity_base_address: 10306,
  core_transaction_add_liquidity_base_error: 10307,
  core_transaction_add_liquidity_asset_error: 10308,
  core_transaction_withdraw_error: 10309,
  core_transaction_deposit_to_pool_error: 10310,
  core_transaction_deposit_insufficient_funds_error: 10311,
  core_transaction_deposit_gas_error: 10312,
  core_transaction_invalid_sender_address: 10313,
  core_transaction_deposit_server_error: 10314,
  core_transaction_user_rejected: 10315,
  core_transaction_failed: 10316,
  core_transaction_invalid_recipient_address: 10317,
  /**
   * Wallets
   */
  wallet_connection_rejected_by_user: 20000,
  wallet_missing_api_key: 20001,
  wallet_chain_not_supported: 20002,
  wallet_missing_params: 20003,
  wallet_provider_not_found: 20004,
  wallet_failed_to_add_or_switch_network: 20005,
  wallet_ledger_connection_error: 20101,
  wallet_ledger_connection_claimed: 20102,
  wallet_ledger_get_address_error: 20103,
  wallet_ledger_device_not_found: 20104,
  wallet_ledger_device_locked: 20105,
  wallet_phantom_not_found: 20201,
  wallet_ctrl_not_found: 20301,
  wallet_ctrl_send_transaction_no_address: 20302,
  wallet_ctrl_contract_address_not_provided: 20303,
  wallet_ctrl_asset_not_defined: 20304,
  wallet_walletconnect_project_id_not_specified: 20401,
  wallet_walletconnect_connection_not_established: 20402,
  wallet_walletconnect_namespace_not_supported: 20403,
  wallet_trezor_failed_to_sign_transaction: 20501,
  wallet_trezor_derivation_path_not_supported: 20502,
  wallet_trezor_failed_to_get_address: 20503,
  wallet_talisman_not_enabled: 20601,
  wallet_talisman_not_found: 20602,
  wallet_polkadot_not_found: 20701,
  wallet_radix_not_found: 20801,
  wallet_radix_transaction_failed: 20802,
  wallet_keepkey_not_found: 20900,
  wallet_keepkey_asset_not_defined: 20901,
  wallet_keepkey_contract_address_not_provided: 20902,
  wallet_keepkey_send_transaction_no_address: 20903,
  wallet_bitkeep_not_found: 21001,
  /**
   * Chainflip
   */
  chainflip_channel_error: 30001,
  chainflip_unknown_asset: 30002,
  chainflip_broker_invalid_params: 30100,
  chainflip_broker_recipient_error: 30101,
  chainflip_broker_register: 30102,
  chainflip_broker_tx_error: 30103,
  chainflip_broker_withdraw: 30104,
  chainflip_broker_fund_only_flip_supported: 30105,
  chainflip_broker_fund_invalid_address: 30106,
  /**
   * THORChain
   */
  thorchain_chain_halted: 40001,
  thorchain_trading_halted: 40002,
  thorchain_swapin_router_required: 40100,
  thorchain_swapin_vault_required: 40101,
  thorchain_swapin_memo_required: 40102,
  thorchain_swapin_token_required: 40103,
  thorchain_preferred_asset_payout_required: 40104,
  /**
   * SwapKit API
   */
  api_v2_invalid_response: 50001,
  api_v2_server_error: 50002,
  api_v2_invalid_method_key_hash: 50003,
  /**
   * Toolboxes
   */
  toolbox_cosmos_signer_not_defined: 90101,
  toolbox_cosmos_no_accounts_found: 90102,
  toolbox_cosmos_verify_signature_no_pubkey: 90103,
  toolbox_evm_no_abi_fragment: 90201,
  toolbox_evm_no_signer: 90202,
  toolbox_evm_no_signer_address: 90203,
  toolbox_evm_no_from_address: 90204,
  toolbox_evm_no_contract_address: 90205,
  toolbox_evm_no_fee_data: 90206,
  toolbox_evm_no_gas_price: 90207,
  toolbox_evm_no_to_address: 90208,
  toolbox_evm_invalid_gas_asset_address: 90209,
  toolbox_evm_provider_not_eip1193_compatible: 90210,
  toolbox_evm_error_estimating_gas_limit: 90211,
  toolbox_evm_error_sending_transaction: 90212,
  toolbox_radix_signer_not_defined: 90301,
  /**
   * Helpers
   */
  helpers_invalid_number_different_decimals: 99000,
  helpers_invalid_number_of_years: 99001,
  helpers_invalid_identifier: 99002,
  helpers_invalid_asset_url: 99003,
  helpers_invalid_asset_identifier: 99004,
  helpers_invalid_memo_type: 99005,
  helpers_failed_to_switch_network: 99103,
  helpers_not_found_provider: 99200,
  /**
   * Anything else
   */
  not_implemented: 99999,
} as const;

export type ErrorKeys = keyof typeof errorCodes;

export class SwapKitError extends Error {
  static ErrorCode = errorCodes;

  constructor(
    errorOrErrorKey: ErrorKeys | { errorKey: ErrorKeys; info?: Record<string, any> },
    sourceError?: any,
  ) {
    const isErrorString = typeof errorOrErrorKey === "string";

    const errorKey = isErrorString ? errorOrErrorKey : errorOrErrorKey.errorKey;

    if (sourceError) {
      console.error(sourceError, {
        stack: sourceError?.stack,
        message: sourceError?.message,
      });
    }

    super(errorKey, {
      cause: {
        code: SwapKitError.ErrorCode[errorKey],
        message: `${errorKey}${isErrorString ? "" : `: ${JSON.stringify(errorOrErrorKey.info)}`}`,
      },
    });

    Object.setPrototypeOf(this, SwapKitError.prototype);
  }
}
