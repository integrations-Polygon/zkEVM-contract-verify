import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, userSigner, aliceSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/interface.sol/Counter.json";
import { abi2, bytecode2 } from "../artifacts/src/interface.sol/MyContract.json";
const sleep = ms => new Promise(res => setTimeout(res, ms));

describe("Fallback contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let abiContract: any;
    let abiContract2: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nEncode Decode UNIT TEST CASES\n");

        // get the contract factory
        const contractFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);
        const contractFactory2 = new ethers.ContractFactory(abi2, bytecode2, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC20 Token smart contract on zkEVM chain....");

        // deploy the contract
        const contract = await contractFactory.deploy();
        const contract2 = await contractFactory2.deploy();

        // wait for the contract to get deployed
        await contract.deployed();
        await sleep(5000); //5 second delay
        await contract2.deployed();

        // get the instance of the deployed contract
        abiContract = new Contract(contract.address, abi, zkEVM_provider);
        abiContract2 = new Contract(contract2.address, abi2, zkEVM_provider);

        console.log("\ncontract deployed at: ", abiContract2.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${abiContract2.address}`
        );
        console.log("\n");
    });

    describe("ABI encode decode contract functionalities tests", async () => {

        it("can increment value", async () => {

            const tx = await abiContract2
                .connect(ownerSigner)
                .incrementCounter(abiContract.address);
            await tx.wait()
            expect(await abiContract2.getCount(abiContract.address)).eq('1');
        });

    });
});