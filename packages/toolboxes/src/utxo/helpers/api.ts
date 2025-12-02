import { networks as zcashNetworks } from "@bitgo/utxo-lib";
import {
  Chain,
  getChainConfig,
  getRPCUrl,
  RequestClient,
  SKConfig,
  SwapKitError,
  type UTXOChain,
  warnOnce,
} from "@swapkit/helpers";
import { networks } from "bitcoinjs-lib";
// @ts-expect-error
import coininfo from "coininfo";
import { uniqid } from "../../utils";

// =============================================================================
// Types
// =============================================================================

type BlockchairParams<T> = T & { chain: Chain; apiKey?: string };
type UtxoApiParams<T> = T & { chain: Chain; apiKey?: string; useRpcPriority: boolean };

// =============================================================================
// Priority Detection Helpers
// =============================================================================

function hasCustomRpcUrl(chain: Chain): boolean {
  const configuredUrls = SKConfig.get("rpcUrls")[chain] || [];
  const defaultUrls = getChainConfig(chain).rpcUrls || [];

  if (configuredUrls.length === 0) return false;
  if (defaultUrls.length === 0) return configuredUrls.length > 0;

  return configuredUrls[0] !== defaultUrls[0];
}

function hasBlockchairApiKey(): boolean {
  const apiKey = SKConfig.get("apiKeys").blockchair;
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * Determines if RPC should be prioritized over Blockchair.
 *
 * Priority logic:
 * 1. If Blockchair API key is set → use Blockchair (return false)
 * 2. If custom RPC is set but no Blockchair key → use RPC (return true)
 * 3. If neither is set → use Blockchair without key (return false)
 */
function shouldPrioritizeRpc(chain: Chain): boolean {
  return hasCustomRpcUrl(chain) && !hasBlockchairApiKey();
}

// =============================================================================
// RPC Request Helper
// =============================================================================

async function rpcRequest<T>(rpcUrl: string, method: string, params: unknown[] = []): Promise<T> {
  const response = await RequestClient.post<{
    id: string;
    result: T;
    error: { message: string; code?: number } | null;
  }>(rpcUrl, {
    body: JSON.stringify({ id: uniqid(), jsonrpc: "1.0", method, params }),
    headers: { "Content-Type": "application/json" },
  });

  if (response.error) {
    throw new SwapKitError("toolbox_utxo_api_error", { error: response.error.message });
  }

  return response.result;
}
type BlockchairFetchUnspentUtxoParams = BlockchairParams<{
  offset?: number;
  limit?: number;
  address: string;
  targetValue?: number;
  accumulativeValue?: number;
}>;

// =============================================================================
// Broadcast Transaction
// =============================================================================

async function broadcastViaBlockchair(chain: Chain, txHash: string) {
  const url = `${baseUrl(chain)}/push/transaction`;
  const body = JSON.stringify({ data: txHash });

  const response = await RequestClient.post<{
    data: { transaction_hash: string } | null;
    context: { code: number; error?: string };
  }>(url, { body, headers: { "Content-Type": "application/json" } });

  if (response.context.code !== 200) {
    throw new SwapKitError("toolbox_utxo_broadcast_failed", {
      error: response.context.error || "Transaction broadcast failed",
    });
  }

  return response.data?.transaction_hash || txHash;
}

async function broadcastViaRpc(chain: Chain, txHash: string) {
  const rpcUrl = await getRPCUrl(chain);
  const result = await rpcRequest<string>(rpcUrl, "sendrawtransaction", [txHash]);

  if (result.includes('"code":-26')) {
    throw new SwapKitError("toolbox_utxo_invalid_transaction", { error: "Transaction amount was too low" });
  }

  return result;
}

async function broadcastUTXOTx({
  chain,
  txHash,
  useRpcPriority,
}: {
  chain: Chain;
  txHash: string;
  useRpcPriority: boolean;
}) {
  const [primary, fallback] = useRpcPriority
    ? [() => broadcastViaRpc(chain, txHash), () => broadcastViaBlockchair(chain, txHash)]
    : [() => broadcastViaBlockchair(chain, txHash), () => broadcastViaRpc(chain, txHash)];

  try {
    return await primary();
  } catch (error) {
    try {
      return await fallback();
    } catch {
      throw error;
    }
  }
}

function baseUrl(chain: Chain) {
  return `https://api.blockchair.com/${mapChainToBlockchairChain(chain)}`;
}

function getDefaultTxFeeByChain(chain: Chain) {
  switch (chain) {
    case Chain.Bitcoin:
      return 5;
    case Chain.Dogecoin:
      return 10000;
    case Chain.Litecoin:
      return 1;
    case Chain.Zcash:
      return 1;
    default:
      return 2;
  }
}

function mapChainToBlockchairChain(chain: Chain) {
  switch (chain) {
    case Chain.BitcoinCash:
      return "bitcoin-cash";
    case Chain.Litecoin:
      return "litecoin";
    case Chain.Dash:
      return "dash";
    case Chain.Dogecoin:
      return "dogecoin";
    case Chain.Zcash:
      return "zcash";
    case Chain.Polkadot:
      return "polkadot";
    default:
      return "bitcoin";
  }
}

async function getSuggestedTxFee(chain: Chain) {
  try {
    //Use Bitgo API for fee estimation
    //Refer: https://app.bitgo.com/docs/#operation/v2.tx.getfeeestimate
    const { feePerKb } = await RequestClient.get<{
      feePerKb: number;
      cpfpFeePerKb: number;
      numBlocks: number;
      feeByBlockTarget: { 1: number; 3: number };
    }>(`https://app.bitgo.com/api/v2/${chain.toLowerCase()}/tx/fee`);
    const suggestedFee = feePerKb / 1000;

    return Math.max(suggestedFee, getDefaultTxFeeByChain(chain));
  } catch {
    return getDefaultTxFeeByChain(chain);
  }
}

async function blockchairRequest<T>(url: string, apiKey?: string): Promise<T> {
  const response = await RequestClient.get<BlockchairResponse<T>>(
    `${url}${apiKey ? `${url.includes("?") ? "&" : "?"}key=${apiKey}` : ""}`,
  );

  if (!response || response.context.code !== 200)
    throw new SwapKitError("toolbox_utxo_api_error", { error: `Failed to query ${url}` });

  return response.data as T;
}

// =============================================================================
// Get Address Data & Balance
// =============================================================================

type AddressDataResult = {
  address: { balance: number };
  utxo: { block_id: number; index: number; transaction_hash: string; value: number }[];
};

async function getAddressDataViaBlockchair(chain: Chain, address: string, apiKey?: string): Promise<AddressDataResult> {
  const response = await blockchairRequest<BlockchairAddressResponse>(
    `${baseUrl(chain)}/dashboards/address/${address}?transaction_details=true`,
    apiKey,
  );
  const data = response[address];
  if (!data) {
    return { address: { balance: 0 }, utxo: [] };
  }
  return { address: { balance: data.address.balance }, utxo: data.utxo };
}

async function getAddressDataViaRpc(chain: Chain, address: string): Promise<AddressDataResult> {
  const rpcUrl = await getRPCUrl(chain);
  const scanResult = await rpcRequest<{
    success: boolean;
    unspents: { txid: string; vout: number; scriptPubKey: string; amount: number; height: number }[];
    total_amount: number;
  }>(rpcUrl, "scantxoutset", ["start", [`addr(${address})`]]);

  if (!scanResult.success) {
    throw new SwapKitError("toolbox_utxo_api_error", { error: "scantxoutset failed" });
  }

  return {
    address: { balance: Math.round(scanResult.total_amount * 1e8) },
    utxo: scanResult.unspents.map((u) => ({
      block_id: u.height,
      index: u.vout,
      transaction_hash: u.txid,
      value: Math.round(u.amount * 1e8),
    })),
  };
}

async function getAddressData({ address, chain, apiKey, useRpcPriority }: UtxoApiParams<{ address?: string }>) {
  if (!address) throw new SwapKitError("toolbox_utxo_invalid_params", { error: "Address is required" });

  const [primary, fallback] = useRpcPriority
    ? [() => getAddressDataViaRpc(chain, address), () => getAddressDataViaBlockchair(chain, address, apiKey)]
    : [() => getAddressDataViaBlockchair(chain, address, apiKey), () => getAddressDataViaRpc(chain, address)];

  try {
    return await primary();
  } catch {
    try {
      return await fallback();
    } catch {
      return { address: { balance: 0 }, utxo: [] };
    }
  }
}

async function getUnconfirmedBalance({ address, chain, apiKey, useRpcPriority }: UtxoApiParams<{ address?: string }>) {
  if (!address) throw new SwapKitError("toolbox_utxo_invalid_params", { error: "Address is required" });

  const [primary, fallback] = useRpcPriority
    ? [() => getAddressDataViaRpc(chain, address), () => getAddressDataViaBlockchair(chain, address, apiKey)]
    : [() => getAddressDataViaBlockchair(chain, address, apiKey), () => getAddressDataViaRpc(chain, address)];

  try {
    const result = await primary();
    return result?.address.balance || 0;
  } catch {
    try {
      const result = await fallback();
      return result?.address.balance || 0;
    } catch {
      return 0;
    }
  }
}

// =============================================================================
// Get Raw Transaction
// =============================================================================

async function getRawTxViaBlockchair(chain: Chain, txHash: string, apiKey?: string) {
  const rawTxResponse = await blockchairRequest<BlockchairRawTransactionResponse>(
    `${baseUrl(chain)}/raw/transaction/${txHash}`,
    apiKey,
  );
  return rawTxResponse?.[txHash]?.raw_transaction || "";
}

async function getRawTxViaRpc(chain: Chain, txHash: string) {
  const rpcUrl = await getRPCUrl(chain);
  return rpcRequest<string>(rpcUrl, "getrawtransaction", [txHash]);
}

async function getRawTx({ chain, apiKey, txHash, useRpcPriority }: UtxoApiParams<{ txHash?: string }>) {
  if (!txHash) throw new SwapKitError("toolbox_utxo_invalid_params", { error: "TxHash is required" });

  const [primary, fallback] = useRpcPriority
    ? [() => getRawTxViaRpc(chain, txHash), () => getRawTxViaBlockchair(chain, txHash, apiKey)]
    : [() => getRawTxViaBlockchair(chain, txHash, apiKey), () => getRawTxViaRpc(chain, txHash)];

  try {
    return await primary();
  } catch (error) {
    try {
      return await fallback();
    } catch {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to fetch raw transaction: ${errorMessage}`);
      return "";
    }
  }
}

async function fetchUtxosBatch({ chain, address, apiKey, offset = 0, limit = 30 }: BlockchairFetchUnspentUtxoParams) {
  // Only fetch the fields we need to reduce payload size
  const fields = "is_spent,transaction_hash,index,value,script_hex,block_id,spending_signature_hex";

  const response = await blockchairRequest<BlockchairOutputsResponse[]>(
    // TODO - remove max value limit once we updated bitcoinjs-lib to support larger values
    `${baseUrl(chain)}/outputs?q=recipient(${address}),is_spent(false),value(..2000000000000000)&s=value(desc)&fields=${fields}&limit=${limit}&offset=${offset}`,
    apiKey,
  );

  const txs = response.map(
    ({ is_spent, script_hex, block_id, transaction_hash, index, value, spending_signature_hex }) => ({
      hash: transaction_hash,
      index,
      is_confirmed: block_id !== -1,
      is_spent,
      script_hex,
      txHex: spending_signature_hex,
      value,
    }),
  );

  return txs;
}

function getTxsValue(txs: Awaited<ReturnType<typeof fetchUtxosBatch>>) {
  return txs.reduce((total, tx) => total + tx.value, 0);
}

function pickMostValuableTxs(
  txs: Awaited<ReturnType<typeof fetchUtxosBatch>>,
  targetValue?: number,
): Awaited<ReturnType<typeof fetchUtxosBatch>> {
  const sortedTxs = [...txs].sort((a, b) => b.value - a.value);

  if (targetValue) {
    const result = [];
    let accumulated = 0;

    for (const utxo of sortedTxs) {
      result.push(utxo);
      accumulated += utxo.value;
      if (accumulated >= targetValue) break;
    }

    return result;
  }

  return sortedTxs;
}

async function getUnspentUtxos({
  chain,
  address,
  apiKey,
  targetValue,
  accumulativeValue = 0,
  offset = 0,
  limit = 30,
}: BlockchairFetchUnspentUtxoParams): Promise<Awaited<ReturnType<typeof fetchUtxosBatch>>> {
  if (!address) throw new SwapKitError("toolbox_utxo_invalid_params", { error: "Address is required" });

  try {
    const utxos = await fetchUtxosBatch({ address, apiKey, chain, limit, offset, targetValue });
    const utxosCount = utxos.length;
    const isComplete = utxosCount < limit;

    const unspentUtxos = utxos.filter(({ is_spent }) => !is_spent);

    const unspentUtxosValue = getTxsValue(unspentUtxos);
    const totalCurrentValue = accumulativeValue + unspentUtxosValue;

    const limitReached = targetValue && totalCurrentValue >= targetValue;

    if (isComplete || limitReached) {
      return pickMostValuableTxs(unspentUtxos, targetValue);
    }

    const nextBatch = await getUnspentUtxos({
      accumulativeValue: totalCurrentValue,
      address,
      apiKey,
      chain,
      limit,
      offset: offset + limit,
      targetValue,
    });

    const allUtxos = [...unspentUtxos, ...nextBatch];

    return pickMostValuableTxs(allUtxos, targetValue);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch unspent UTXOs: ${errorMessage}`);
    return [];
  }
}

// =============================================================================
// Get UTXOs
// =============================================================================

type UtxoResult = {
  address: string;
  hash: string;
  index: number;
  txHex: string | undefined;
  value: number;
  witnessUtxo: { script: Buffer; value: number };
};

async function getUtxosViaBlockchair({
  address,
  chain,
  apiKey,
  fetchTxHex = true,
  targetValue,
  useRpcPriority,
}: UtxoApiParams<{ address: string; fetchTxHex?: boolean; targetValue?: number }>): Promise<UtxoResult[]> {
  const utxos = await getUnspentUtxos({ address, apiKey, chain, targetValue });

  const results: UtxoResult[] = [];

  for (const { hash, index, script_hex, value } of utxos) {
    let txHex: string | undefined;
    if (fetchTxHex) {
      txHex = await getRawTx({ apiKey, chain, txHash: hash, useRpcPriority });
    }
    results.push({
      address,
      hash,
      index,
      txHex,
      value,
      witnessUtxo: { script: Buffer.from(script_hex, "hex"), value },
    });
  }
  return results;
}

async function getUtxosViaRpc({
  address,
  chain,
  fetchTxHex = true,
  targetValue,
}: {
  address: string;
  chain: Chain;
  fetchTxHex?: boolean;
  targetValue?: number;
}): Promise<UtxoResult[]> {
  const rpcUrl = await getRPCUrl(chain);

  const scanResult = await rpcRequest<{
    success: boolean;
    unspents: { txid: string; vout: number; scriptPubKey: string; amount: number; height: number }[];
    total_amount: number;
  }>(rpcUrl, "scantxoutset", ["start", [`addr(${address})`]]);

  if (!scanResult.success) {
    throw new SwapKitError("toolbox_utxo_api_error", { error: "scantxoutset failed" });
  }

  let unspents = scanResult.unspents.map((u) => ({
    ...u,
    // Convert BTC amount to satoshis
    value: Math.round(u.amount * 1e8),
  }));

  // Sort by value descending and pick most valuable if targetValue is set
  unspents.sort((a, b) => b.value - a.value);

  if (targetValue) {
    const selected = [];
    let accumulated = 0;
    for (const utxo of unspents) {
      selected.push(utxo);
      accumulated += utxo.value;
      if (accumulated >= targetValue) break;
    }
    unspents = selected;
  }

  const results: UtxoResult[] = [];

  for (const { txid, vout, scriptPubKey, value } of unspents) {
    let txHex: string | undefined;
    if (fetchTxHex) {
      try {
        txHex = await rpcRequest<string>(rpcUrl, "getrawtransaction", [txid]);
      } catch {
        // Continue without txHex if fetch fails
      }
    }
    results.push({
      address,
      hash: txid,
      index: vout,
      txHex,
      value,
      witnessUtxo: { script: Buffer.from(scriptPubKey, "hex"), value },
    });
  }

  return results;
}

async function getUtxos({
  address,
  chain,
  apiKey,
  fetchTxHex = true,
  targetValue,
  useRpcPriority,
}: UtxoApiParams<{ address: string; fetchTxHex?: boolean; targetValue?: number }>): Promise<UtxoResult[]> {
  const [primary, fallback] = useRpcPriority
    ? [
        () => getUtxosViaRpc({ address, chain, fetchTxHex, targetValue }),
        () => getUtxosViaBlockchair({ address, apiKey, chain, fetchTxHex, targetValue, useRpcPriority }),
      ]
    : [
        () => getUtxosViaBlockchair({ address, apiKey, chain, fetchTxHex, targetValue, useRpcPriority }),
        () => getUtxosViaRpc({ address, chain, fetchTxHex, targetValue }),
      ];

  try {
    return await primary();
  } catch (error) {
    try {
      return await fallback();
    } catch {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to fetch UTXOs: ${errorMessage}`);
      return [];
    }
  }
}

export function getUtxoApi(chain: UTXOChain) {
  const apiKey = SKConfig.get("apiKeys").blockchair || "";
  const useRpcPriority = shouldPrioritizeRpc(chain);

  // Only warn if using Blockchair without API key (not when using custom RPC)
  warnOnce({
    condition: !apiKey && !useRpcPriority,
    id: "no_blockchair_api_key_warning",
    warning: "No Blockchair API key found. Functionality will be limited.",
  });

  return {
    broadcastTx: (txHash: string) => broadcastUTXOTx({ chain, txHash, useRpcPriority }),
    getAddressData: (address: string) => getAddressData({ address, apiKey, chain, useRpcPriority }),
    getBalance: (address: string) => getUnconfirmedBalance({ address, apiKey, chain, useRpcPriority }),
    getRawTx: (txHash: string) => getRawTx({ apiKey, chain, txHash, useRpcPriority }),
    getSuggestedTxFee: () => getSuggestedTxFee(chain),
    getUtxos: (params: { address: string; fetchTxHex?: boolean; targetValue?: number }) =>
      getUtxos({ ...params, apiKey, chain, useRpcPriority }),
  };
}

/**
 * "Factory" to ensure typing for custom UTXO APIs
 */
export function createCustomUtxoApi(methods: ReturnType<typeof getUtxoApi>) {
  return methods;
}

export function getUtxoNetwork() {
  return function getNetwork(chain: Chain) {
    switch (chain) {
      case Chain.Bitcoin:
        return networks.bitcoin;
      case Chain.BitcoinCash:
        return coininfo.bitcoincash.main.toBitcoinJS();
      case Chain.Dash:
        return coininfo.dash.main.toBitcoinJS();
      case Chain.Litecoin:
        return coininfo.litecoin.main.toBitcoinJS();

      case Chain.Dogecoin: {
        const bip32 = { private: 0x04358394, public: 0x043587cf };
        const test = coininfo.dogecoin.test;
        test.versions.bip32 = bip32;
        return coininfo.dogecoin.main.toBitcoinJS();
      }

      case Chain.Zcash: {
        return zcashNetworks.zcash;
      }

      default:
        throw new SwapKitError("toolbox_utxo_not_supported", { chain });
    }
  };
}

interface BlockchairVin {
  txid: string;
  vout: number;
  scriptSig: { asm: string; hex: string };
  sequence: number;
}

interface BlockchairVout {
  value: number;
  n: number;
  scriptPubKey: { asm: string; hex: string; address: string; type: string; addresses: string[]; reqSigs: number };
}

interface BlockchairTransaction {
  block_id: number;
  hash: string;
  time: string;
  balance_change: number;
}

interface BlockchairUtxo {
  block_id: number;
  transaction_hash: string;
  index: number;
  value: number;
}

interface BlockchairAddressCoreData {
  type: string;
  script_hex: string;
  balance: number;
  balance_usd: number;
  received: number;
  received_usd: number;
  spent: number;
  spent_usd: number;
  output_count: number;
  unspent_output_count: number;
  first_seen_receiving: string;
  last_seen_receiving: string;
  first_seen_spending: null | string;
  last_seen_spending: null | string;
  transaction_count: number;
  scripthash_type: null | string;
}

interface BlockchairInputOutputCommonData {
  block_id: number;
  transaction_id: number;
  index: number;
  transaction_hash: string;
  date: string;
  time: string;
  value: number;
  value_usd: number;
  recipient: string;
  type: string;
  script_hex: string;
  is_from_coinbase: boolean;
  is_spendable: boolean | null;
  is_spent: boolean;
  lifespan: number | null;
  cdd: number | null;
}

interface BlockchairSpendingBlockData {
  spending_block_id: number | null;
  spending_transaction_id: number | null;
  spending_index: number | null;
  spending_transaction_hash: string | null;
  spending_date: string | null;
  spending_time: string | null;
  spending_value_usd: number | null;
  spending_sequence: number | null;
  spending_signature_hex: string | null;
  spending_witness: string | null;
}

interface BlockchairAddressResponse {
  [key: string]: { address: BlockchairAddressCoreData; transactions: BlockchairTransaction[]; utxo: BlockchairUtxo[] };
}

interface BlockchairOutputsResponse extends BlockchairSpendingBlockData, BlockchairInputOutputCommonData {}

interface BlockchairRawTransactionResponse {
  [key: string]: {
    raw_transaction: string;
    decoded_raw_transaction: {
      txid: string;
      hash: string;
      version: number;
      size: number;
      vsize: number;
      weight: number;
      locktime: number;
      vin: BlockchairVin[];
      vout: BlockchairVout[];
    };
  };
}

interface BlockchairResponse<T> {
  data: T;
  context: {
    code: number;
    source: string;
    results: number;
    state: number;
    market_price_usd: number;
    cache: { live: boolean; duration: number; since: string; until: string; time: any };
    api: {
      version: string;
      last_major_update: string;
      next_major_update: null | string;
      documentation: string;
      notice: string;
    };
    servers: string;
    time: number;
    render_time: number;
    full_time: number;
    request_cost: number;
  };
}
