import { Chain } from "@swapkit/helpers";
import { SwapKit, keystoreWallet } from "@swapkit/sdk";
import { KEYSTORE_SUPPORTED_CHAINS } from "@swapkit/wallets/keystore";

const swapKit = SwapKit({
  wallets: keystoreWallet,
});

const phrase = process.env.TEST_PHRASE;

if (!phrase) {
  throw new Error("TEST_PHRASE is not set");
}

console.info("Connecting to keystore...");
await swapKit.connectKeystore(KEYSTORE_SUPPORTED_CHAINS, phrase);
console.info("Connected to keystore");

console.info("Getting balance...");
const balance = await swapKit.getBalance(Chain.Bitcoin);
console.info("Balance:", balance);

console.info("Addresses: ");

for (const chain of KEYSTORE_SUPPORTED_CHAINS) {
  const address = swapKit.getAddress(chain);
  console.info(`${chain}: ${address}`);
}
