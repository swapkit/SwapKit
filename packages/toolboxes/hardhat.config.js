import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: { url: "https://ethereum-rpc.publicnode.com" || "" },
    },
  },
};

export default config;
