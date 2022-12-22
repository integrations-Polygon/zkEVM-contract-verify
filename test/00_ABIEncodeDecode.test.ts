import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/abi_encode_decode_contracts/abi.sol/ABItest.json";

describe("ABI Encode Decode contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let abiContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    const BYTES = "0x0000000000000000000000000000000000000000000000000000000000000037";
    const BYTES2 = "0x2140ed820000000000000000000000000000000000000000000000000000000000000037";

    before(async () => {
        console.log("DEPLOYING ALL UNIT TEST SMART CONTRACTS ON-CHAIN\n");

        // get the contract factory
        const contractFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        // console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\n-----------------------------------------------------------------------------");
        console.log("Deploying ABI encode decode smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------\n");
        // deploy the contract
        const contract = await contractFactory.deploy();

        // wait for the contract to get deployed
        await contract.deployed();

        // get the instance of the deployed contract
        abiContract = new Contract(contract.address, abi, zkEVM_provider);

        console.log("ABI Contract Deployed at: ", abiContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${abiContract.address}`
        );
    });

    describe("ABI encode decode contract functionalities tests", async () => {
        it("...can encode", async () => {
            expect(await abiContract.enc("55")).eq(BYTES);
        });

        it("...can decode", async () => {
            expect(await abiContract.dec(BYTES)).eq("55");
        });

        it("...can encode with selector", async () => {
            expect(await abiContract.encWithSelector("55")).eq(BYTES2);
        });

        it("...can decode with selector", async () => {
            expect(await abiContract.dec(BYTES)).eq("55");
        });

        it("...can encode with signature", async () => {
            expect(await abiContract.encWithSignature("55")).eq(BYTES2);
        });

        it("...can decode with signature", async () => {
            expect(await abiContract.dec(BYTES)).eq("55");
        });
    });
});
