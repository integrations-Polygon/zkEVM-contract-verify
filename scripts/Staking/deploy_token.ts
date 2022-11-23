import { ethers } from "hardhat";
import { MyToken__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const MyToken = (await ethers.getContractFactory("MyToken")) as MyToken__factory;
    const myToken = await MyToken.deploy();
    console.log("\nDeploying erc20 token smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", myToken.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${myToken.address}`);
}
deploy();