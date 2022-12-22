import { ethers } from "hardhat";
import { NFTAsset__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const NFTAsset = (await ethers.getContractFactory("NFTAsset")) as NFTAsset__factory;
    const nftAsset = await NFTAsset.deploy();
    console.log("\nDeploying nft asset smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("Contract Deployed at: ", nftAsset.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${nftAsset.address}`);
}
deploy();
