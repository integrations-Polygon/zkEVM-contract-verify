import { ethers } from "hardhat";
import { TestERC165__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const ERC165 = (await ethers.getContractFactory("TestERC165")) as TestERC165__factory;
    const erc165 = await ERC165.deploy();
    console.log("\nDeploying ERC165 smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\nERC20 Token contract deployed at: ", erc165.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${erc165.address}`);
}

deploy();
