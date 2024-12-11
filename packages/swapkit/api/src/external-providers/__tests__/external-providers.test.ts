import { describe, expect, test } from "bun:test";
import { ChainId } from "@swapkit/helpers";
import { swaptkitExternalProvidersApi } from "../endpoints";

describe("should return the correct response for balance", () => {
  test("LTC", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Litecoin,
      isDev: true,
    });

    const response = await api.getBalance("ltc1q29hm7wn047c8vgqeth8d97nn7k5xrtgrek9dzg");

    expect(response).toBeArray();

    const balance = response?.[0];

    expect(balance?.chain).toBe("LTC");
    expect(balance?.decimal).toBe(8);
    expect(balance?.identifier).toBe("LTC.LTC");
    expect(Number(balance?.value)).toBeNumber();
  });

  test("ETH", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Ethereum,
      isDev: true,
    });

    const response = await api.getBalance("0x7FF6907C874a9442EAF9c3f86F24d50391aC555f");

    expect(response).toBeArray();

    response.forEach((balance) => {
      expect(balance).toHaveProperty("chain", "ETH");
      expect(balance).toHaveProperty("decimal");
      expect(balance.decimal).toBeNumber();
      expect(balance).toHaveProperty("symbol");
      expect(balance.symbol).toBeString();
      expect(balance).toHaveProperty("value");
      expect(Number(balance.value)).toBeNumber();
    });
  });
});

describe("should return the correct response for raw tx", () => {
  test("BTC", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Bitcoin,
      isDev: true,
    });

    const response = await api.getRawTx(
      "07ac034fa366f271d638352cdb0a96b5830e2d72d80378b85be95497bc85612d",
    );

    // FIXME: api returns string, request client tries to parse it to json object, causing a test failure here.
    expect(response).toBe(
      "0100000000010170fb9124d649025893dfdbd9ac1d65e9572091890519ad9187af8807d99e35c90100000000fdffffff0220933300000000002200207bb8f5802ae446be4e5f7dde387ca1624faee09a8643a8c16ff87df4235e25845b1d70000000000022002022660edb22aaf0caec4ff17cf2e0117029ba61369f49de8d0bedbeef1c9e21e30400483045022100f87a16352df7177cdfb1a779f71fd54c07b6fc84db97cdf9463434ba0e934e7402201db3889709063e27ff9cb62d13cae3f6b918b0aec9054337bfe66e8d8c0641be01473044022100b02d245f2381cce6b0d58e8b39ba7cae8eca1033d7857ea1078ddffee7a3f3b1021f7e4952fd3c44b44f9457a2732b8237c4786e3bd66483d2c4b7d12cc2fc2a9a016952210374289bccda370609b0df0633e5078dc2b9a693e5c20c2c1c41de8fbf074b07a221029ee74e69b22d5f8c1ceffc3c842d2393dc7313c87f1d96f25bfa0c982739473221036c6cf3d37907b4d7f140b9db4f06df85d584729d7854eb1940afa8ec17d4a6a153ae00000000",
    );
  });
});

describe("should return the correct response for scan utxos", () => {
  test("BTC", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Bitcoin,
      isDev: true,
    });

    const response = await api.scanUTXOs("bc1q3lp7z8x0h9uuzu9keu9esnzz59yuehufljxqk6");

    expect(response).toBeArray();
    response.forEach((utxo) => {
      expect(utxo).toHaveProperty("address");
      expect(utxo).toHaveProperty("hash");
      expect(utxo).toHaveProperty("index");
      expect(utxo).toHaveProperty("value");
      expect(utxo).toHaveProperty("witnessUtxo");

      expect(utxo.address).toBeString();
      expect(utxo.address.startsWith("bc1")).toBeTrue();

      expect(utxo.hash).toBeString();
      expect(utxo.hash).toHaveLength(64);

      expect(utxo.index).toBeNumber();
      expect(utxo.value).toBeNumber();

      expect(utxo.witnessUtxo).toHaveProperty("value");
      expect(utxo.witnessUtxo).toHaveProperty("script");
      expect(utxo.witnessUtxo.value).toBe(utxo.value);
      expect(Array.isArray(utxo.witnessUtxo.script)).toBeTrue();
      expect(utxo.witnessUtxo.script.length).toBeGreaterThan(0);
    });
  });

  test("BTC with tx hex", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Bitcoin,
      isDev: true,
    });

    const response = await api.scanUTXOs("bc1q3lp7z8x0h9uuzu9keu9esnzz59yuehufljxqk6", true);

    expect(response).toBeArray();
    response.forEach((utxo) => {
      expect(utxo).toHaveProperty("txHex");
    });
  });
});

describe("should return the correct response for address details", () => {
  test("BTC address details", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Bitcoin,
      isDev: true,
    });

    const response = await api.getAddressData("bc1q3lp7z8x0h9uuzu9keu9esnzz59yuehufljxqk6");

    expect(response.address).toBeObject();
    const { address } = response;

    expect(address.type).toBe("witness_v0_scripthash");
    expect(address.script_hex).toBe("00148fc3e11ccfb979c170b6cf0b984c42a149ccdf89");
    expect(address.balance).toBeNumber();
    expect(address.balance_usd).toBeNumber();
    expect(address.received).toBeNumber();
    expect(address.spent).toBeNumber();
    expect(address.output_count).toBeNumber();

    // Test timestamps
    expect(address.first_seen_receiving).toBeString();
    expect(address.last_seen_receiving).toBeString();
    expect(address.first_seen_spending).toBeString();
    expect(address.last_seen_spending).toBeString();

    // Test transaction list
    expect(response.transactions).toBeArray();
    expect(response.transactions.length).toBeGreaterThan(0);
    response.transactions.forEach((txHash) => {
      expect(txHash).toBeString();
      expect(txHash).toHaveLength(64);
    });

    expect(response.utxo).toBeArray();

    response.utxo.forEach((utxo) => {
      expect(utxo).toHaveProperty("block_id");
      expect(utxo).toHaveProperty("transaction_hash");
      expect(utxo).toHaveProperty("index");
      expect(utxo).toHaveProperty("value");

      expect(utxo.block_id).toBeNumber();
      expect(utxo.transaction_hash).toHaveLength(64);
      expect(utxo.index).toBeNumber();
      expect(utxo.value).toBeNumber();
      expect(utxo.value).toBeGreaterThan(0);
    });
  });
});

describe("should return the correct response for suggested tx fee", () => {
  test("BTC", async () => {
    const api = swaptkitExternalProvidersApi({
      apiKey: "55b9bbcd-9ef0-4a52-8b9a-a5aff43db4a3",
      chainId: ChainId.Bitcoin,
      isDev: true,
    });

    const response = await api.getSuggestedTxFee();
    expect(response).toBeNumber();
  });
});
