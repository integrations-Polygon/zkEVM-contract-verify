import { ethers } from "hardhat";
import { MultiCall__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const MultiCall = (await ethers.getContractFactory("MultiCall")) as MultiCall__factory;
    const multiCall = await MultiCall.deploy();
    console.log("\nDeploying MultiCall smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", multiCall.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${multiCall.address}`);
}
deploy();
