import { ethers } from "hardhat";
import { ERC721Token__factory } from "../src/types";

async function deploy() {
    // get the contract to deploy
    const ERC1155 = (await ethers.getContractFactory("TestTokenERC1155")) as ERC721Token__factory;
    const erc1155 = await ERC1155.deploy();
    console.log("\nDeploying ERC1155 Token smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\nERC1155 Token contract deployed at: ", erc1155.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${erc1155.address}`);
}

deploy();
