import { ethers } from "hardhat";
import { ABItest__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    console.log("\nDeploying ABI encode decode smart contract on zkEVM chain....");

    const ABI = (await ethers.getContractFactory("ABItest")) as ABItest__factory;
    const abiContract = await ABI.deploy();
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", abiContract.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${abiContract.address}`);
}
deploy();