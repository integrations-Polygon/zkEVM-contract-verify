import { ethers } from "hardhat";
import { AssetFactoryCreate2__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const AssetFactory = (await ethers.getContractFactory(
        "AssetFactoryCreate2"
    )) as AssetFactoryCreate2__factory;
    const assetFactory = await AssetFactory.deploy();
    console.log("\nDeploying nft asset smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("\ncontract deployed at: ", assetFactory.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${assetFactory.address}`);
}
deploy();
