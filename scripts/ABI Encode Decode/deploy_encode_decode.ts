import { ethers } from "hardhat";
import { ABItest__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const ABI = (await ethers.getContractFactory("ABItest")) as ABItest__factory;
    const abi = await ABI.deploy();
    console.log("\nDeploying ABI encode decode smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", abi.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${fallback.address}`);
}
deploy();