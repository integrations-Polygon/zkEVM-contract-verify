import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, adminSigner, userSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import {
    abi,
    bytecode,
} from "../artifacts/src/erc_tokens_contracts/ERC721PsiLandMinter.sol/ERC721PsiLandMinter.json";

describe("ERC721Psi Token deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc721PsiTokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR Batch Minting using ERC721Psi TOKEN\n");

        // get the contract factory
        const erc721PsiContractFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC721psi Token smart contract on zkEVM chain....");

        // deploy the contract
        const erc721PsiToken = await erc721PsiContractFactory.deploy();

        // wait for the contract to get deployed
        await erc721PsiToken.deployed();

        // get the instance of the deployed contract
        erc721PsiTokenContract = new Contract(erc721PsiToken.address, abi, zkEVM_provider);

        console.log("\nERC721Psi Token contract deployed at: ", erc721PsiTokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc721PsiTokenContract.address}`
        );
        console.log("\n");
    });

    describe("ERC721Psi Token functionalities tests", async () => {
        it("...has correct token name", async () => {
            expect(await erc721PsiTokenContract.name()).eq("Batch Mint Test");
        });

        it("...has correct token symbol", async () => {
            expect(await erc721PsiTokenContract.symbol()).eq("BMT");
        });

        it("...should allow owner to set an admin", async () => {
            const setAdminTx = await erc721PsiTokenContract
                .connect(ownerSigner)
                .setAdmin(adminSigner.getAddress(), "true");
            await setAdminTx.wait(1);
            expect(await erc721PsiTokenContract.isAdmin(adminSigner.getAddress())).eq(true);
        });

        it("...should allow admin to set base URI", async () => {
            const setBaseUriTx = await erc721PsiTokenContract
                .connect(adminSigner)
                .setBaseURI("ipfs://some-random-hash/");
            await setBaseUriTx.wait(1);
            expect(await erc721PsiTokenContract.getBaseURI()).eq("ipfs://some-random-hash/");
        });

        it("...should allow owner to batch mint 10 ERC721psi tokens", async () => {
            const batchMintTokensTx = await erc721PsiTokenContract.connect(ownerSigner).batchMintTokens(10);
            await batchMintTokensTx.wait(1);
            expect(await erc721PsiTokenContract.balanceOf(ownerSigner.getAddress())).eq("10");
        });

        it("...should allow admin to batch mint 10 ERC721psi tokens", async () => {
            const batchMintTokensTx = await erc721PsiTokenContract.connect(adminSigner).batchMintTokens(10);
            await batchMintTokensTx.wait(1);
            expect(await erc721PsiTokenContract.balanceOf(adminSigner.getAddress())).eq("10");
        });

        it("...should allow owner to batch mint 100 ERC721psi tokens", async () => {
            const batchMintTokensTx = await erc721PsiTokenContract.connect(ownerSigner).batchMintTokens(100);
            await batchMintTokensTx.wait(1);
            expect(await erc721PsiTokenContract.balanceOf(ownerSigner.getAddress())).eq("110");
        });

        it("...should allow admin to batch mint 100 ERC721psi tokens", async () => {
            const batchMintTokensTx = await erc721PsiTokenContract.connect(adminSigner).batchMintTokens(100);
            await batchMintTokensTx.wait(1);
            expect(await erc721PsiTokenContract.balanceOf(adminSigner.getAddress())).eq("110");
        });

        it("...should allow correct tokenURI for a given tokens", async () => {
            expect(await erc721PsiTokenContract.tokenURI(0)).eq("ipfs://some-random-hash/0.json");
            expect(await erc721PsiTokenContract.tokenURI(9)).eq("ipfs://some-random-hash/9.json");
            expect(await erc721PsiTokenContract.tokenURI(10)).eq("ipfs://some-random-hash/10.json");
            expect(await erc721PsiTokenContract.tokenURI(19)).eq("ipfs://some-random-hash/19.json");
        });

        it("...should allow owner to transfer the ERC721Psi token", async () => {
            const transferFromTx = await erc721PsiTokenContract
                .connect(ownerSigner)
                .transferFrom(ownerSigner.getAddress(), userSigner.getAddress(), 0);
            await transferFromTx.wait(1);

            expect(await erc721PsiTokenContract.ownerOf(0)).eq(userSigner.getAddress());
        });

        it("...should allow admin to transfer the ERC721Psi tokens", async () => {
            const transferFromTx = await erc721PsiTokenContract
                .connect(adminSigner)
                .transferFrom(adminSigner.getAddress(), userSigner.getAddress(), 10);
            await transferFromTx.wait(1);

            expect(await erc721PsiTokenContract.ownerOf(10)).eq(userSigner.getAddress());
        });

        it("...should allow user to transfer the ERC721Psi token", async () => {
            const transferFromTx = await erc721PsiTokenContract
                .connect(userSigner)
                .transferFrom(userSigner.getAddress(), ownerSigner.getAddress(), 0);
            await transferFromTx.wait(1);

            const transferFromTx_2 = await erc721PsiTokenContract
                .connect(userSigner)
                .transferFrom(userSigner.getAddress(), adminSigner.getAddress(), 10);
            await transferFromTx_2.wait(1);

            expect(await erc721PsiTokenContract.ownerOf(0)).eq(ownerSigner.getAddress());
            expect(await erc721PsiTokenContract.ownerOf(10)).eq(adminSigner.getAddress());
        });
    });
});
