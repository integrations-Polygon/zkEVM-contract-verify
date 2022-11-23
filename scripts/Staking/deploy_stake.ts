import { ethers } from "hardhat";
import { StakeToken__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const testToken = ''
    const StakeToken = (await ethers.getContractFactory("NFTAsset")) as StakeToken__factory;
    const stakeToken = await StakeToken.deploy(testToken);
    console.log("\nDeploying staking smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", stakeToken.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${stakeToken.address}`);
}
deploy();