import { ethers } from "hardhat";
import { TestTokenERC20__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const ERC20 = (await ethers.getContractFactory("TestTokenERC20")) as TestTokenERC20__factory;
    const erc20 = await ERC20.deploy();
    console.log("\nDeploying ERC20 Token smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\nERC20 Token Contract Deployed at: ", erc20.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${erc20.address}`);
}

deploy();
