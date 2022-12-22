import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import testMultiCall_artifacts from "../artifacts/src/multicall_contracts/multicall.sol/TestMultiCall.json";
import MultiCall_artifacts from "../artifacts/src/multicall_contracts/MultiCall.sol/MultiCall.json";

describe("MultiCall contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let multiCallContract: any;
    let testMultiCallContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\n-----------------------------------------------------------------------------");
        console.log("Deploying MultiCall smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------\n");

        // check & display current balances
        await checkBalances(derivedNode);

        // get the contract factory
        const testMultiCall_factory = new ethers.ContractFactory(
            testMultiCall_artifacts.abi,
            testMultiCall_artifacts.bytecode,
            ownerSigner
        );
        const multiCall_factory = new ethers.ContractFactory(
            MultiCall_artifacts.abi,
            MultiCall_artifacts.bytecode,
            ownerSigner
        );

        // deploy the contract
        const testMultiCall_contract = await testMultiCall_factory.deploy();
        const multiCall_contract = await multiCall_factory.deploy();

        // wait for the contract to get deployed
        await testMultiCall_contract.deployed();
        await multiCall_contract.deployed();

        // get the instance of the deployed contract
        testMultiCallContract = new Contract(
            testMultiCall_contract.address,
            testMultiCall_artifacts.abi,
            zkEVM_provider
        );
        multiCallContract = new Contract(multiCall_contract.address, MultiCall_artifacts.abi, zkEVM_provider);

        console.log("\nTestMultiCall Contract Deployed at: ", testMultiCallContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${testMultiCallContract.address}`
        );
        console.log("\n");
        console.log("MultiCall Contract Deployed at: ", multiCallContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${multiCallContract.address}`
        );
    });

    describe("MultiCall contract functionalities tests", async () => {
        it("...can getData from testMultiCall", async () => {
            const getData = await testMultiCallContract.getData("15");
            expect(getData).eq("0x29e99f07000000000000000000000000000000000000000000000000000000000000000f");
        });

        it("...can call MultiCall", async () => {
            const getData = await testMultiCallContract.getData("15");
            const multiCall = await multiCallContract.multiCall([testMultiCallContract.address], [getData]);
            expect(multiCall[0]).eq("0x000000000000000000000000000000000000000000000000000000000000000f");
        });
    });
});
