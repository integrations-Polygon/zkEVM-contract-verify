import { ethers } from "hardhat";
import { Timelock__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const Timelock = (await ethers.getContractFactory("MultiSigWallet")) as Timelock__factory;
    const timelock = await Timelock.deploy();
    console.log("\nDeploying staking smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", timelock.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${timelock.address}`);
}
deploy();
