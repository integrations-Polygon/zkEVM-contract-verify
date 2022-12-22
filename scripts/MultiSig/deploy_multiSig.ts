import { ethers } from "hardhat";
import { MultiSigWallet__factory } from "../../src/types";
import dotenv from "dotenv";
dotenv.config();

const owner_1: any = process.env.MULTISIG_OWNER_1;
const owner_2: any = process.env.MULTISIG_OWNER_2;
const owner_3: any = process.env.MULTISIG_OWNER_3;
const owner_4: any = process.env.MULTISIG_OWNER_4;

async function deploy() {
    // get the contract to deploy
    const MultiSigWallet = (await ethers.getContractFactory("MultiSigWallet")) as MultiSigWallet__factory;
    const multiSigWallet = await MultiSigWallet.deploy([owner_1, owner_2, owner_3, owner_4]);
    console.log("\nDeploying staking smart contract on zkEVM chain....");
    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    await delay(20000);
    console.log("Contract Deployed at: ", multiSigWallet.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${multiSigWallet.address}`);
}
deploy();
