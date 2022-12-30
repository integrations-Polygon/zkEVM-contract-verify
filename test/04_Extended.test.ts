import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/extended_contracts/Extended.sol/ModifiedAccessControl.json";

describe("Extended contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let extendedContract: any;

    // setup atleast 5 wallet addresses for testing

    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\n-----------------------------------------------------------------------------------");
        console.log("Deploying Extended smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------------\n");

        // check & display current balances
        await checkBalances(derivedNode);

        // get the contract factory
        const extended_Factory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        // deploy the contract
        const extended_contract = await extended_Factory.deploy();
        await extended_contract.deployed();

        // get the instance of the deployed contract
        extendedContract = new Contract(extended_contract.address, abi, zkEVM_provider);

        console.log("\nExtended token Contract Deployed at: ", extendedContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${extendedContract.address}`
        );
    });

    describe("Extended contract functionalities tests", async () => {
        it("...can read function", async () => {
            const role = await extendedContract.ROLE();
            const address = await ownerSigner.getAddress();
            expect(await extendedContract.hasRole(role, address)).eq(true);
        });

        it("...can override", async () => {
            const role = await extendedContract.ROLE();
            const address = await ownerSigner.getAddress();
            const tx = await extendedContract.connect(ownerSigner).revokeRole(role, address);
            await tx.wait(2);
            expect(await extendedContract.isOverride()).eq(true);
        });
    });
});
