import { ethers } from "hardhat";
import { ERC721Token__factory } from "../src/types";

async function deploy() {
    // get the contract to deploy
    const ERC721 = (await ethers.getContractFactory("TestTokenERC721")) as ERC721Token__factory;
    const erc721 = await ERC721.deploy();
    console.log("\nDeploying ERC721 Token smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\nERC721 Token contract deployed at: ", erc721.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${erc721.address}`);
}

deploy();
