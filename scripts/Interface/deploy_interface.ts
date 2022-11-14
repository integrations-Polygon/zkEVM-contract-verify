import { ethers } from "hardhat";
import { Counter__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const Interface = (await ethers.getContractFactory("Counter")) as Counter__factory;
    const interface_contract = await Interface.deploy();
    console.log("\nDeploying interface smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", interface_contract.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${interface_contract.address}`);
}
deploy();
