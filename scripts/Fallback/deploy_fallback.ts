import { ethers } from "hardhat";
import { Fallback__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const Fallback = (await ethers.getContractFactory("Fallback")) as Fallback__factory;
    const fallback = await Fallback.deploy();
    console.log("\nDeploying fallback smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", fallback.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${fallback.address}`);
}
deploy();