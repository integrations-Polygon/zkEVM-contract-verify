import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import fallback_artifacts from "../artifacts/src/fallback_contracts/fallback.sol/Fallback.json";
import sendToFallback_artifacts from "../artifacts/src/fallback_contracts/fallback.sol/SendToFallback.json";

describe("Fallback contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let fallback: any;
    let sendToFallback: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\n-----------------------------------------------------------------------------");
        console.log("Deploying Fallback smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------\n");

        // check & display current balances
        await checkBalances(derivedNode);

        // get the contract factory
        const fallback_factory = new ethers.ContractFactory(
            fallback_artifacts.abi,
            fallback_artifacts.bytecode,
            ownerSigner
        );
        const sendToFallback_factory = new ethers.ContractFactory(
            sendToFallback_artifacts.abi,
            sendToFallback_artifacts.bytecode,
            ownerSigner
        );

        // deploy the contract
        const fallback_contract = await fallback_factory.deploy();
        const sendToFallback_contract = await sendToFallback_factory.deploy();

        // wait for the contract to get deployed
        await fallback_contract.deployed();
        await sendToFallback_contract.deployed();

        // get the instance of the deployed contract
        fallback = new Contract(fallback_contract.address, fallback_artifacts.abi, zkEVM_provider);
        sendToFallback = new Contract(
            sendToFallback_contract.address,
            sendToFallback_artifacts.abi,
            zkEVM_provider
        );

        console.log("\nFallback Contract Deployed at: ", sendToFallback.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${sendToFallback.address}`
        );
    });

    describe("Fallback contract functionalities tests", async () => {
        it("...can transfer to fallback", async () => {
            const tx = await sendToFallback
                .connect(ownerSigner)
                .transferToFallback(fallback.address, { value: ethers.utils.parseEther("0.00001") });
            await tx.wait();
            expect(await fallback.getBalance()).eq(ethers.utils.parseEther("0.00001"));
        });

        it("...can call fallback", async () => {
            const tx = await sendToFallback
                .connect(ownerSigner)
                .callFallback(fallback.address, { value: ethers.utils.parseEther("0.00001") });
            await tx.wait();
            expect(await fallback.getBalance()).eq(ethers.utils.parseEther("0.00002"));
        });
    });
});
