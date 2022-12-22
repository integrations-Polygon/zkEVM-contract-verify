import { expect } from "chai";
import { ethers, Contract } from "ethers";
import { abi, bytecode } from "../artifacts/src/erc165_contracts/ERC165.sol/TestERC165.json";
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import dotenv from "dotenv";
import { checkBalances } from "./utils/checkBalances";
dotenv.config();

describe("ERC165 contract deployment & tests on zkEVM", async function () {
    // declare an instance of the contract to be deployed
    let erc165Contract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\n-----------------------------------------------------------------------------");
        console.log("Deploying ERC165 smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------\n");

        // check & display current balances
        await checkBalances(derivedNode);

        // get the contract factory
        const erc165ContractFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        // deploy the contract
        const erc165 = await erc165ContractFactory.deploy();

        // wait for the contract to get deployed
        await erc165.deployed();

        // get the instance of the deployed contract
        erc165Contract = new Contract(erc165.address, abi, zkEVM_provider);

        console.log("\nERC165 Contract Deployed at: ", erc165.address);
        console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${erc165.address}`);
    });

    describe("ERC165 contract interface availability test", async () => {
        it("...has Interface_ID Availability", async () => {
            expect(await erc165Contract.supportsInterface(0x01ffc9a7)).to.equal(true);
        });
    });
});
