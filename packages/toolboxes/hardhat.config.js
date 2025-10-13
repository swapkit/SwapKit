import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  networks: {
    hardhat: {
      chainType: "l1",
      forking: { enabled: true, url: "https://ethereum-rpc.publicnode.com" },
      type: "edr-simulated",
    },
  },
  plugins: [hardhatEthers, hardhatNetworkHelpers],
  solidity: "0.8.24",
};

export default config;
