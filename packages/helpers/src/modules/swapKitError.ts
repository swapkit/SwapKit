/** biome-ignore-all assist/source/useSortedKeys: its sorted by type */
const errorCodes = {
  /**
   * Core
   */
  core_estimated_max_spendable_chain_not_supported: 10001,
  core_extend_error: 10002,
  core_inbound_data_not_found: 10003,
  core_approve_asset_address_or_from_not_found: 10004,
  core_plugin_not_found: 10005,
  core_plugin_swap_not_found: 10006,
  core_approve_asset_target_invalid: 10007,
  core_explorer_unsupported_chain: 10008,
  core_verify_message_not_supported: 10009,
  core_chain_halted: 10010,
  /**
   * Core - Wallet
   */
  core_wallet_connection_not_found: 10101,
  core_wallet_ctrl_not_installed: 10102,
  core_wallet_evmwallet_not_installed: 10103,
  core_wallet_walletconnect_not_installed: 10104,
  core_wallet_keystore_not_installed: 10105,
  core_wallet_ledger_not_installed: 10106,
  core_wallet_trezor_not_installed: 10107,
  core_wallet_keplr_not_installed: 10108,
  core_wallet_okx_not_installed: 10109,
  core_wallet_keepkey_not_installed: 10110,
  core_wallet_talisman_not_installed: 10111,
  core_wallet_not_keypair_wallet: 10112,
  core_wallet_sign_message_not_supported: 10113,
  core_wallet_connection_failed: 10114,
  core_wallet_create_not_supported: 10115,
  /**
   * Core - Swap
   */
  core_swap_invalid_params: 10201,
  core_swap_route_not_complete: 10202,
  core_swap_asset_not_recognized: 10203,
  core_swap_contract_not_found: 10204,
  core_swap_route_transaction_not_found: 10205,
  core_swap_contract_not_supported: 10206,
  core_swap_transaction_error: 10207,
  core_swap_quote_mode_not_supported: 10208,
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
   * Wallets - General
   */
  wallet_connection_rejected_by_user: 20001,
  wallet_missing_api_key: 20002,
  wallet_chain_not_supported: 20003,
  wallet_missing_params: 20004,
  wallet_provider_not_found: 20005,
  wallet_failed_to_add_or_switch_network: 20006,
  /**
   * Wallets - Ledger
   */
  wallet_ledger_connection_error: 20101,
  wallet_ledger_connection_claimed: 20102,
  wallet_ledger_get_address_error: 20103,
  wallet_ledger_device_not_found: 20104,
  wallet_ledger_device_locked: 20105,
  wallet_ledger_transport_error: 20106,
  wallet_ledger_public_key_error: 20107,
  wallet_ledger_derivation_path_error: 20108,
  wallet_ledger_signing_error: 20109,
  wallet_ledger_app_not_open: 20110,
  wallet_ledger_invalid_response: 20111,
  wallet_ledger_method_not_supported: 20112,
  wallet_ledger_invalid_params: 20113,
  wallet_ledger_invalid_signature: 20114,
  wallet_ledger_no_provider: 20115,
  wallet_ledger_pubkey_not_found: 20116,
  wallet_ledger_transport_not_defined: 20117,
  wallet_ledger_webusb_not_supported: 20118,
  wallet_ledger_chain_not_supported: 20119,
  wallet_ledger_invalid_asset: 20120,
  wallet_ledger_invalid_account: 20121,
  wallet_ledger_address_not_found: 20122,
  wallet_ledger_failed_to_get_address: 20123,
  wallet_ledger_webhid_not_supported: 20124,
  /**
   * Wallets - Phantom
   */
  wallet_phantom_not_found: 20201,
  /**
   * Wallets - Ctrl
   */
  wallet_ctrl_not_found: 20301,
  wallet_ctrl_send_transaction_no_address: 20302,
  wallet_ctrl_contract_address_not_provided: 20303,
  wallet_ctrl_asset_not_defined: 20304,
  /**
   * Wallets - WalletConnect
   */
  wallet_walletconnect_project_id_not_specified: 20401,
  wallet_walletconnect_connection_not_established: 20402,
  wallet_walletconnect_namespace_not_supported: 20403,
  wallet_walletconnect_chain_not_supported: 20404,
  wallet_walletconnect_invalid_method: 20405,
  wallet_walletconnect_method_not_supported: 20406,
  /**
   * Wallets - Trezor
   */
  wallet_trezor_failed_to_sign_transaction: 20501,
  wallet_trezor_derivation_path_not_supported: 20502,
  wallet_trezor_failed_to_get_address: 20503,
  wallet_trezor_transport_error: 20504,
  wallet_trezor_method_not_supported: 20505,
  /**
   * Wallets - Talisman
   */
  wallet_talisman_not_enabled: 20601,
  wallet_talisman_not_found: 20602,
  /**
   * Wallets - Polkadot
   */
  wallet_polkadot_not_found: 20701,
  /**
   * Wallets - Radix
   */
  wallet_radix_not_found: 20801,
  wallet_radix_transaction_failed: 20802,
  wallet_radix_invalid_manifest: 20803,
  wallet_radix_method_not_supported: 20804,
  wallet_radix_no_account: 20805,
  /**
   * Wallets - KeepKey
   */
  wallet_keepkey_not_found: 20901,
  wallet_keepkey_asset_not_defined: 20902,
  wallet_keepkey_contract_address_not_provided: 20903,
  wallet_keepkey_send_transaction_no_address: 20904,
  wallet_keepkey_derivation_path_error: 20905,
  wallet_keepkey_signing_error: 20906,
  wallet_keepkey_transport_error: 20907,
  wallet_keepkey_unsupported_chain: 20908,
  wallet_keepkey_invalid_response: 20909,
  wallet_keepkey_chain_not_supported: 20910,
  wallet_keepkey_signer_not_found: 20911,
  wallet_keepkey_no_accounts: 20912,
  wallet_keepkey_method_not_supported: 20913,
  wallet_keepkey_invalid_params: 20914,
  wallet_keepkey_config_not_found: 20915,
  wallet_keepkey_no_provider: 20916,
  wallet_keepkey_account_not_found: 20917,
  /**
   * Wallets - BitKeep/BitGet
   */
  wallet_bitkeep_not_found: 21001,
  wallet_bitkeep_failed_to_switch_network: 21002,
  wallet_bitkeep_no_accounts: 21003,
  /**
   * Wallets - Passkeys
   */
  wallet_passkeys_sign_transaction_error: 21101,
  wallet_passkeys_not_found: 21102,
  wallet_passkeys_no_address: 21103,
  wallet_passkeys_request_canceled: 21104,
  wallet_passkeys_signature_canceled: 21105,
  wallet_passkeys_failed_to_switch_network: 21106,
  wallet_passkeys_chain_not_supported: 21107,
  wallet_passkeys_instance_missing: 21108,
  /**
   * Wallets - OneKey
   */
  wallet_onekey_not_found: 21201,
  wallet_onekey_sign_transaction_error: 21202,
  /**
   * Wallets - OKX
   */
  wallet_okx_not_found: 21301,
  wallet_okx_chain_not_supported: 21302,
  wallet_okx_failed_to_switch_network: 21303,
  wallet_okx_no_accounts: 21304,
  /**
   * Wallets - Keplr
   */
  wallet_keplr_not_found: 21401,
  wallet_keplr_chain_not_supported: 21402,
  wallet_keplr_signer_not_found: 21403,
  wallet_keplr_no_accounts: 21404,
  /**
   * Wallets - Cosmostation
   */
  wallet_cosmostation_not_found: 21501,
  wallet_cosmostation_chain_not_supported: 21502,
  wallet_cosmostation_evm_provider_not_found: 21503,
  wallet_cosmostation_keplr_provider_not_found: 21504,
  wallet_cosmostation_no_accounts: 21505,
  wallet_cosmostation_no_evm_accounts: 21506,
  wallet_cosmostation_no_evm_address: 21507,
  wallet_cosmostation_signer_not_found: 21508,
  /**
   * Wallets - ###EMPTY### 21601
   */

  /**
   * Wallets - Coinbase
   */
  wallet_coinbase_not_found: 21701,
  wallet_coinbase_chain_not_supported: 21702,
  wallet_coinbase_method_not_supported: 21703,
  wallet_coinbase_no_accounts: 21704,
  /**
   * Wallets - EVM Extensions
   */
  wallet_evm_extensions_failed_to_switch_network: 21801,
  wallet_evm_extensions_no_provider: 21802,
  wallet_evm_extensions_not_found: 21803,
  /**
   * Wallets - Keystore
   */
  wallet_keystore_invalid_password: 21901,
  wallet_keystore_unsupported_version: 21902,
  /**
   * Wallets - Near Extensions
   */
  wallet_near_extensions_failed_to_switch_network: 22001,
  wallet_near_extensions_no_provider: 22002,
  wallet_near_extensions_not_found: 22003,
  wallet_near_method_not_supported: 22003,
  /**
   * Wallets - Vultisig
   */
  wallet_vultisig_not_found: 22101,
  wallet_vultisig_contract_address_not_provided: 22102,
  wallet_vultisig_asset_not_defined: 22103,
  wallet_vultisig_send_transaction_no_address: 22104,

  /**
   * Wallets - Xaman
   */
  wallet_xaman_not_configured: 23001,
  wallet_xaman_not_connected: 23002,
  wallet_xaman_auth_failed: 23003,
  wallet_xaman_connection_failed: 23004,
  wallet_xaman_transaction_failed: 23005,
  wallet_xaman_monitoring_failed: 23006,
  /**
   * Wallets - TronLink
   */
  wallet_tronlink_request_accounts_failed: 24001,
  wallet_tronlink_locked: 24002,

  /**
   * Chainflip
   */
  chainflip_channel_error: 30001,
  chainflip_unknown_asset: 30002,
  /**
   * Chainflip - Broker
   */
  chainflip_broker_invalid_params: 30101,
  chainflip_broker_recipient_error: 30102,
  chainflip_broker_register: 30103,
  chainflip_broker_tx_error: 30104,
  chainflip_broker_withdraw: 30105,
  chainflip_broker_fund_only_flip_supported: 30106,
  chainflip_broker_fund_invalid_address: 30107,
  /**
   * THORChain
   */
  thorchain_chain_halted: 40001,
  thorchain_trading_halted: 40002,
  thorchain_asset_is_not_tcy: 40003,
  /**
   * THORChain - Swap
   */
  thorchain_swapin_router_required: 40101,
  thorchain_swapin_vault_required: 40102,
  thorchain_swapin_memo_required: 40103,
  thorchain_swapin_token_required: 40104,
  thorchain_preferred_asset_payout_required: 40105,
  /**
   * Toolboxes - Cosmos
   */
  toolbox_cosmos_account_not_found: 50101,
  toolbox_cosmos_invalid_fee: 50102,
  toolbox_cosmos_invalid_params: 50103,
  toolbox_cosmos_no_signer: 50104,
  toolbox_cosmos_not_supported: 50105,
  toolbox_cosmos_signer_not_defined: 50106,
  toolbox_cosmos_validate_address_prefix_not_found: 50107,
  toolbox_cosmos_verify_signature_no_pubkey: 50108,
  /**
   * Toolboxes - EVM
   */
  toolbox_evm_error_estimating_gas_limit: 50201,
  toolbox_evm_error_sending_transaction: 50202,
  toolbox_evm_gas_estimation_error: 50203,
  toolbox_evm_invalid_gas_asset_address: 50204,
  toolbox_evm_invalid_params: 50205,
  toolbox_evm_invalid_transaction: 50206,
  toolbox_evm_no_abi_fragment: 50207,
  toolbox_evm_no_contract_address: 50208,
  toolbox_evm_no_fee_data: 50209,
  toolbox_evm_no_from_address: 50210,
  toolbox_evm_no_gas_price: 50211,
  toolbox_evm_no_signer_address: 50212,
  toolbox_evm_no_signer: 50213,
  toolbox_evm_no_to_address: 50214,
  toolbox_evm_not_supported: 50215,
  toolbox_evm_provider_not_eip1193_compatible: 50216,
  /**
   * Toolboxes - UTXO
   */
  toolbox_utxo_api_error: 50301,
  toolbox_utxo_broadcast_failed: 50302,
  toolbox_utxo_insufficient_balance: 50303,
  toolbox_utxo_invalid_address: 50304,
  toolbox_utxo_invalid_params: 50305,
  toolbox_utxo_invalid_transaction: 50306,
  toolbox_utxo_no_signer: 50307,
  toolbox_utxo_not_supported: 50308,
  /**
   * Toolboxes - Solana
   */
  toolbox_solana_no_signer: 50401,
  toolbox_solana_fee_estimation_failed: 50402,
  /**
   * Toolboxes - Substrate
   */
  toolbox_substrate_not_supported: 50501,
  toolbox_substrate_transfer_error: 50502,
  /**
   * Toolboxes - Radix
   */
  toolbox_radix_method_not_supported: 50601,
  /**
   * Toolboxes - Ripple
   */
  toolbox_ripple_get_balance_error: 50701,
  toolbox_ripple_rpc_not_configured: 50702,
  toolbox_ripple_signer_not_found: 50703,
  toolbox_ripple_asset_not_supported: 50704,
  toolbox_ripple_broadcast_error: 50705,
  /**
   * Toolboxes - Tron
   */
  toolbox_tron_no_signer: 50801,
  toolbox_tron_invalid_token_identifier: 50802,
  toolbox_tron_token_transfer_failed: 50803,
  toolbox_tron_transaction_creation_failed: 50804,
  toolbox_tron_fee_estimation_failed: 50805,
  toolbox_tron_trongrid_api_error: 50806,
  toolbox_tron_approve_failed: 50807,
  toolbox_tron_invalid_token_contract: 50808,
  toolbox_tron_allowance_check_failed: 50809,
  /**
   * Toolboxes - Near
   */
  toolbox_near_no_signer: 90601,
  toolbox_near_invalid_address: 90602,
  toolbox_near_invalid_amount: 90603,
  toolbox_near_transfer_failed: 90604,
  toolbox_near_access_key_error: 90605,
  toolbox_near_no_rpc_url: 90606,
  toolbox_near_empty_batch: 90607,
  toolbox_near_balance_failed: 90608,
  toolbox_near_invalid_name: 90609,
  toolbox_near_missing_contract_address: 90610,
  toolbox_near_no_account: 90611,
  toolbox_near_invalid_gas_params: 90612,
  toolbox_near_no_public_key_found: 90613,
  /**
   * Toolboxes - SUI
   */
  toolbox_sui_address_required: 90701,
  toolbox_sui_keypair_required: 90702,
  toolbox_sui_balance_error: 90703,
  toolbox_sui_transaction_creation_error: 90704,
  toolbox_sui_signing_error: 90705,
  toolbox_sui_broadcast_error: 90706,
  toolbox_sui_no_signer: 90707,
  toolbox_sui_no_sender: 90708,
  /**
   * Toolboxes - General
   */
  toolbox_not_supported: 59901,
  /**
   * NEAR Plugin
   */
  plugin_near_invalid_name: 41001,
  plugin_near_no_connection: 41002,
  plugin_near_name_unavailable: 41003,
  plugin_near_registration_failed: 41004,
  plugin_near_transfer_failed: 41005,
  /**
   * Garden Plugin
   */
  plugin_garden_missing_data: 42001,
  /**
   * SwapKit API
   */
  api_v2_invalid_response: 60001,
  api_v2_server_error: 60002,
  api_v2_invalid_method_key_hash: 60003,
  /**
   * Helpers
   */
  helpers_invalid_number_different_decimals: 70001,
  helpers_invalid_number_of_years: 70002,
  helpers_invalid_identifier: 70003,
  helpers_invalid_asset_url: 70004,
  helpers_invalid_asset_identifier: 70005,
  helpers_invalid_memo_type: 70006,
  helpers_failed_to_switch_network: 70007,
  helpers_not_found_provider: 70008,
  helpers_chain_not_supported: 70009,
  helpers_invalid_params: 70010,
  helpers_invalid_response: 70011,
  helpers_chain_no_public_or_set_rpc_url: 70012,
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
    sourceErrorOrInfo?: any,
  ) {
    const isErrorString = typeof errorOrErrorKey === "string";
    const errorKey = isErrorString ? errorOrErrorKey : errorOrErrorKey.errorKey;
    const info = isErrorString ? undefined : errorOrErrorKey.info;
    const message = `${errorKey}${info ? `: ${JSON.stringify(info)}` : ""}`;

    super(message);
    Object.setPrototypeOf(this, SwapKitError.prototype);

    this.name = "SwapKitError";
    this.cause = sourceErrorOrInfo;

    // Log errors for debugging - bundlers can strip this in production if needed
    if (sourceErrorOrInfo) {
      const errorMsg =
        sourceErrorOrInfo instanceof Error
          ? `${sourceErrorOrInfo.message}${sourceErrorOrInfo.cause ? ` (${sourceErrorOrInfo.cause})` : ""}`
          : JSON.stringify(sourceErrorOrInfo);
      console.error(`SwapKitError [${errorKey}]: ${errorMsg}`);
    } else if (info) {
      console.error(`SwapKitError [${errorKey}]: ${JSON.stringify(info)}`);
    }
  }
}
