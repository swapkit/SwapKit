import { Chain, RequestClient, SKConfig, type UTXOChain, warnOnce } from "@swapkit/helpers";
import { networks } from "bitcoinjs-lib";
import { uniqid } from "../../utils";

// @ts-ignore
import coininfo from "coininfo";

type BlockchairParams<T> = T & { chain: Chain; apiKey?: string };
type BlockchairFetchUnspentUtxoParams = BlockchairParams<{
  offset?: number;
  limit?: number;
  address: string;
}>;

async function broadcastUTXOTx({ chain, txHash }: { chain: Chain; txHash: string }) {
  const rpcUrl = SKConfig.get("rpcUrls")[chain];
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: "sendrawtransaction",
    params: [txHash],
    id: uniqid(),
  });

  const response = await RequestClient.post<{
    id: string;
    result: string;
    error: { message: string; code?: number } | null;
  }>(rpcUrl, { headers: { "Content-Type": "application/json" }, body });

  if (response.error) {
    throw new Error(`failed to broadcast a transaction: ${response.error?.message}`);
  }

  if (response.result.includes('"code":-26')) {
    throw new Error("Invalid transaction: the transaction amount was too low");
  }

  return response.result;
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
  } catch (_error) {
    return getDefaultTxFeeByChain(chain);
  }
}

async function blockchairRequest<T>(url: string, apiKey?: string): Promise<T> {
  try {
    const response = await RequestClient.get<BlockchairResponse<T>>(url);
    if (!response || response.context.code !== 200) throw new Error(`failed to query ${url}`);

    return response.data as T;
  } catch (error) {
    if (!apiKey) throw error;
    const response = await RequestClient.get<BlockchairResponse<T>>(
      `${url}${apiKey ? `&key=${apiKey}` : ""}`,
    );

    if (!response || response.context.code !== 200) throw new Error(`failed to query ${url}`);

    return response.data as T;
  }
}

async function getAddressData({ address, chain, apiKey }: BlockchairParams<{ address?: string }>) {
  if (!address) throw new Error("address is required");

  try {
    const response = await blockchairRequest<BlockchairAddressResponse>(
      `${baseUrl(chain)}/dashboards/address/${address}?transaction_details=true`,
      apiKey,
    );

    return response[address];
  } catch (_error) {
    return { utxo: [], address: { balance: 0, transaction_count: 0 } };
  }
}

async function getUnconfirmedBalance({
  address,
  chain,
  apiKey,
}: BlockchairParams<{ address?: string }>) {
  const response = await getAddressData({ address, chain, apiKey });

  return response?.address.balance || 0;
}

async function getRawTx({ chain, apiKey, txHash }: BlockchairParams<{ txHash?: string }>) {
  if (!txHash) throw new Error("txHash is required");

  try {
    const rawTxResponse = await blockchairRequest<BlockchairRawTransactionResponse>(
      `${baseUrl(chain)}/raw/transaction/${txHash}`,
      apiKey,
    );
    return rawTxResponse?.[txHash]?.raw_transaction || "";
  } catch (error) {
    console.error(error);
    return "";
  }
}

async function fetchUnspentUtxoBatch({
  chain,
  address,
  apiKey,
  offset = 0,
  limit = 100,
}: BlockchairFetchUnspentUtxoParams) {
  const response = await blockchairRequest<BlockchairOutputsResponse[]>(
    `${baseUrl(chain)}/outputs?q=is_spent(false),recipient(${address})&limit=${limit}&offset=${offset}`,
    apiKey,
  );

  const txs = response
    .filter(({ is_spent }) => !is_spent)
    .map(({ script_hex, block_id, transaction_hash, index, value, spending_signature_hex }) => ({
      hash: transaction_hash,
      index,
      value,
      txHex: spending_signature_hex,
      script_hex,
      is_confirmed: block_id !== -1,
    }));

  return txs;
}

async function getUnspentUtxos({
  chain,
  address,
  apiKey,
  offset = 0,
  limit = 100,
}: BlockchairFetchUnspentUtxoParams): Promise<Awaited<ReturnType<typeof fetchUnspentUtxoBatch>>> {
  if (!address) throw new Error("address is required");

  try {
    const txs = await fetchUnspentUtxoBatch({ chain, address, apiKey, offset, limit });

    if (txs.length <= limit) return txs;

    const nextBatch = await getUnspentUtxos({
      chain,
      address,
      apiKey,
      offset: offset + limit,
      limit,
    });

    return [...txs, ...nextBatch];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function scanUTXOs({
  address,
  chain,
  apiKey,
  fetchTxHex = true,
}: BlockchairParams<{ address: string; fetchTxHex?: boolean }>) {
  const utxos = await getUnspentUtxos({ chain, address, apiKey });
  const results = [];

  for (const { hash, index, script_hex, value } of utxos) {
    let txHex: string | undefined;
    if (fetchTxHex) {
      txHex = await getRawTx({ txHash: hash, chain, apiKey });
    }
    results.push({
      address,
      hash,
      index,
      txHex,
      value,
      witnessUtxo: { value, script: Buffer.from(script_hex, "hex") },
    });
  }
  return results;
}

function utxoApi(chain: UTXOChain) {
  const apiKey = SKConfig.get("apiKeys").blockchair || "";

  warnOnce(!apiKey, "No Blockchair API key found. Functionality will be limited.");

  return {
    broadcastTx: (txHash: string) => broadcastUTXOTx({ txHash, chain }),
    getRawTx: (txHash: string) => getRawTx({ txHash, chain, apiKey }),
    getSuggestedTxFee: () => getSuggestedTxFee(chain),
    getBalance: (address: string) => getUnconfirmedBalance({ address, chain, apiKey }),
    getAddressData: (address: string) => getAddressData({ address, chain, apiKey }),
    scanUTXOs: (params: { address: string; fetchTxHex?: boolean }) =>
      scanUTXOs({ ...params, chain, apiKey }),
  };
}

/**
 * "Factory" to ensure typing for custom UTXO APIs
 */
export function createCustomUtxoApi(methods: ReturnType<typeof utxoApi>) {
  return methods;
}

export function getUtxoApi(chain: UTXOChain) {
  const customUtxoApi = SKConfig.get("apis")[chain];

  if (customUtxoApi) {
    warnOnce(true, "Using custom UTXO API. Be sure to implement all methods to avoid issues.");
    return customUtxoApi as ReturnType<typeof utxoApi>;
  }

  return utxoApi(chain);
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
      default:
        throw new Error("Invalid chain");
    }
  };
}

interface BlockchairVin {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
}

interface BlockchairVout {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    address: string;
    type: string;
    addresses: string[];
    reqSigs: number;
  };
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
  [key: string]: {
    address: BlockchairAddressCoreData;
    transactions: BlockchairTransaction[];
    utxo: BlockchairUtxo[];
  };
}

interface BlockchairOutputsResponse
  extends BlockchairSpendingBlockData,
    BlockchairInputOutputCommonData {}

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
    cache: {
      live: boolean;
      duration: number;
      since: string;
      until: string;
      time: any;
    };
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
