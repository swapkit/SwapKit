import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  networks: { hardhat: { forking: { url: "https://ethereum-rpc.publicnode.com" || "" } } },
  solidity: "0.8.24",
};

export default config;
