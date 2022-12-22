import { ethers } from "hardhat";
import { AssetFactoryCreate__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const AssetFactory = (await ethers.getContractFactory(
        "AssetFactoryCreate"
    )) as AssetFactoryCreate__factory;
    const assetFactory = await AssetFactory.deploy();
    console.log("\nDeploying nft asset smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("Contract Deployed at: ", assetFactory.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${assetFactory.address}`);
}
deploy();
