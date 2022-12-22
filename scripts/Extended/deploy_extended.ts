import { ethers } from "hardhat";
import { ModifiedAccessControl__factory } from "../../src/types";

async function deploy() {
    // get the contract to deploy
    const ModifiedAccessControl = (await ethers.getContractFactory(
        "ModifiedAccessControl"
    )) as ModifiedAccessControl__factory;
    const modifiedAccessControl = await ModifiedAccessControl.deploy();
    console.log("\nDeploying extended smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("Contract Deployed at: ", modifiedAccessControl.address);
    console.log(
        `Contract Details: https://explorer.public.zkevm-test.net/address/${modifiedAccessControl.address}`
    );
}
deploy();
