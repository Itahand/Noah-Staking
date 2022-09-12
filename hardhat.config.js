require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({path:'/.env'})


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    localhost: {},
    kovan: {
      url: "https://kovan.infura.io/v3/ec64d55030574eb6a50d1c90e367685d",
      accounts: ["7d2c671f5779e9dca9b9f69a1d18005ce3e87c0c27ebf65eb945f1f4af258d7b"]
    }
  },
};