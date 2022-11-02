import { expect } from "chai";
import { ethers, Contract } from "ethers";

describe("ERC165",function(){
    
    let TestERC165:any;
    const provider:any = new ethers.providers.JsonRpcProvider('https://public.zkevm-test.net:2083/');

    it("Interface_ID Availability",async function(){
        
        // const [owner] = await ethers.getSigners();
        // console.log("Signers object", owner);
        // const TestERC165 =await ethers.getContractFactory("TestERC165");

        // const testERC165 = TestERC165.deploy();

        // const result = await testERC165.supportsInterface(0x01ffc9a7);

        // console.log(result);

        TestERC165 = new Contract('0xA0a1d9f4149aa1D7F79Dcf085B863C30Fec3C0De',[
            {
                "inputs": [
                    {
                        "internalType": "bytes4",
                        "name": "interfaceId",
                        "type": "bytes4"
                    }
                ],
                "name": "supportsInterface",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ],provider);

        expect(await TestERC165.supportsInterface(0x01ffc9a7)).to.equal(true);

        
    })

});