import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, userSigner, aliceSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/proxy.sol/Proxy.json";
import upgrades from "hardhat";

describe("Proxy contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let proxyContract: any;

    // setup atleast 5 wallet addresses for testing

    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR PROXY CONTRACT\n");

        // get the contract factory
        const proxyContractFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC20 Token smart contract on zkEVM chain....");

        // deploy the contract
        const proxy = await proxyContractFactory.deploy();
        // const erc20Token = await upgrades.deployProxy(erc20TokenFactory);

        // wait for the contract to get deployed
        await proxy.deployed();

        // get the instance of the deployed contract
        proxyContract = new Contract(proxy.address, abi, zkEVM_provider);

        console.log("\nProxy contract deployed at: ", proxyContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${proxyContract.address}`
        );
        console.log("\n");
    });

    describe("Proxy contract functionalities tests", async () => {

        it("has initialize correct value", async () => {
            expect(await proxyContract.value()).eq("5");
        });

        it("can set value", async () => {
            const setValue = await proxyContract.connect(ownerSigner).set_value('7');
            await setValue.wait(1);
            expect(await proxyContract.value()).eq('7');
        });

    });
});
