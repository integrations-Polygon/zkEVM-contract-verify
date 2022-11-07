import { expect } from "chai";
import { ethers, Contract } from "ethers";
import { abi, bytecode } from '../artifacts/src/zkevm_erc165.sol/TestERC165.json';
import { setupWallets, zkEVM_provider, ownerSigner, userSigner, aliceSigner } from "./utils/setupWallet";
import dotenv from "dotenv";
import { checkBalances } from "./utils/checkBalances";
dotenv.config();

describe("ERC165",async function(){
    
    let TestERC165:any;
    
    const derivedNode= await setupWallets();
    before(async () => {


        const TestERC165factory = new ethers.ContractFactory(abi, bytecode,ownerSigner);
    
        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);
        console.log("\nDeploying ERC165TEST smart contract on zkEVM chain....");
        const testERC165 = await TestERC165factory.deploy();
        await testERC165.deployed();

        TestERC165 = new Contract(testERC165.address, abi,zkEVM_provider);
        
        console.log("\nERC165Test contract deployed at: ", testERC165.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${testERC165.address}`
        );
        console.log("\n");
    });
    describe("ERC165 tests", async () => {
        it('Interface_ID Availability', async () => {
            expect(await TestERC165.supportsInterface(0x01ffc9a7)).to.equal(true);    
        });
        expect(await TestERC165.supportsInterface(0x01ffc9a7)).to.equal(true);        

        
    })

});