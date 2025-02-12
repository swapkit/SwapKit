import { AssetValue, Chain, SwapKit } from "@swapkit/core";
import { ThorchainPlugin } from "@swapkit/plugins/thorchain";
import { keystoreWallet } from "@swapkit/wallets/keystore";
const phrase = process.env.PHRASES;

if (!phrase) throw new Error("No phrase found");

const getSwapKitClient = () =>
  SwapKit({
    wallets: { ...keystoreWallet },
    plugins: { ...ThorchainPlugin },
  });
/**
 * send an asset from your wallet to another address
 */
export const doSend = async ({
  sendAmount,
  toAddress,
}: {
  sendAmount: number;
  toAddress: string;
}) => {
  try {
    const skClient = getSwapKitClient();
    const from = skClient.getAddress(Chain.THORChain);
    const balance = await skClient.getBalance(Chain.THORChain);
    console.info(`Balance: ${balance}`);
    console.info(`💰 Wallet - ${from} | Balance: ${balance}}`);

    const assetValue = await AssetValue.from({
      asset: "THOR.RUNE",
      value: sendAmount,
      asyncTokenLookup: true,
    });
    console.info(`💰 Sending ${sendAmount} RUNE to ${toAddress}`);
    console.info(`💰 Asset value: ${assetValue.toString()}`);
    const tx = await skClient.transfer({
      from,
      assetValue,
      recipient: toAddress,
      memo: "",
    });
    return tx;
  } catch (error) {
    console.error(error);
    return "";
  }
};

const main = async () => {
  const tx = await doSend({
    sendAmount: 0.1,
    toAddress: "thor1e9lxzfl7x2zvxnjczf8v0urel8943nesq9c4pk",
  });
  console.info(tx);
};

main();
