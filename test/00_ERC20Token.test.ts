import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, userSigner, aliceSigner } from "./utils/setupWallet";
import { ethers, Contract} from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/abi.sol/ABItest.json";

describe("Proxy contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let abiContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR PROXY CONTRACT\n");

        // get the contract factory
        const contractFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);
    
        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC20 Token smart contract on zkEVM chain....");

        // deploy the contract
        const contract = await contractFactory.deploy();

        // wait for the contract to get deployed
        await contract.deployed();

        // get the instance of the deployed contract
        abiContract = new Contract(contract.address, abi, zkEVM_provider);

        console.log("\nProxy contract deployed at: ", abiContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${abiContract.address}`
        );
        console.log("\n");
    });

    describe("ABI encode decode contract functionalities tests", async () => {

        it("can encode", async () => {

            expect(await abiContract.enc(
                '10',
                '0xC980bBe81d7AE0CcbF72B6AbD59534dd8d176c77',
                '20'
            )).eq(process.env.BYTES);
        });

        it("can decode", async () => {
            const data = await abiContract.dec(process.env.BYTES)
            expect(await abiContract.dec(process.env.BYTES)).eq(
                '10,0xC980bBe81d7AE0CcbF72B6AbD59534dd8d176c77,20'
            );
        });

    });
});