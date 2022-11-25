import { ethers } from "hardhat";
import { TestMultiCall__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const TestMultiCall = (await ethers.getContractFactory("TestMultiCall")) as TestMultiCall__factory;
    const testMultiCall = await TestMultiCall.deploy();
    console.log("\nDeploying TestMultiCall smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", testMultiCall.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${testMultiCall.address}`);
}
deploy();
