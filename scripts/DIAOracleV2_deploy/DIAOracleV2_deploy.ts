import { ethers } from "hardhat";
import { DIAOracleV2__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const DIAOracleV2 = (await ethers.getContractFactory("DIAOracleV2")) as DIAOracleV2__factory;
    const diaOracleV2 = await DIAOracleV2.deploy();
    console.log("\nDeploying DIAOracleV2 smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("DIAOracleV2 Contract Deployed at: ", diaOracleV2.address);
    console.log(`Contract Details: https://testnet-zkevm.polygonscan.com/address/${diaOracleV2.address}`);
}

deploy();
