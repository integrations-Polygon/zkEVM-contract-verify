import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, adminSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/erc_tokens_contracts/ERC721Token.sol/TestTokenERC721.json";

describe("ERC721 tokens deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc721TokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR STANDARD ERC721 TOKENS\n");

        // get the contract factory
        const erc721TokenFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC721 tokens smart contract on zkEVM chain....");

        // deploy the contract
        const erc721Token = await erc721TokenFactory.deploy();

        // wait for the contract to get deployed
        await erc721Token.deployed();

        // get the instance of the deployed contract
        erc721TokenContract = new Contract(erc721Token.address, abi, zkEVM_provider);

        console.log("\nERC721 token contract deployed at: ", erc721TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc721TokenContract.address}`
        );
        console.log("\n");
    });

    describe("ERC721 tokens functionalities tests", async () => {
        it("...has correct token name", async () => {
            expect(await erc721TokenContract.name()).eq("Test ERC721 tokens");
        });

        it("...has correct token symbol", async () => {
            expect(await erc721TokenContract.symbol()).eq("TT721");
        });

        it("...can set an admin", async () => {
            const setAdminTx = await erc721TokenContract
                .connect(ownerSigner)
                .setAdmin(adminSigner.getAddress(), "true");
            await setAdminTx.wait(1);
            expect(await erc721TokenContract.isAdmin(adminSigner.getAddress())).eq(true);
        });

        it("...should allow owner to mint ERC721 tokenss", async () => {
            const mintTx = await erc721TokenContract
                .connect(ownerSigner)
                .issueToken(ownerSigner.getAddress(), "some-random-hash-1");
            await mintTx.wait(1);
            expect(await erc721TokenContract.balanceOf(ownerSigner.getAddress())).eq("1");
        });

        it("...should allow admin to mint ERC721 tokenss", async () => {
            const mintTx = await erc721TokenContract
                .connect(adminSigner)
                .issueToken(adminSigner.getAddress(), "some-random-hash-2");
            await mintTx.wait(1);
            expect(await erc721TokenContract.balanceOf(adminSigner.getAddress())).eq("1");
        });

        it("...should allow owner to batch mint ERC721 tokenss", async () => {
            const batchMintTx = await erc721TokenContract
                .connect(ownerSigner)
                .issueBatch(ownerSigner.getAddress(), [
                    "some-random-hash-3",
                    "some-random-hash-4",
                    "some-random-hash-5",
                    "some-random-hash-6",
                    "some-random-hash-7",
                    "some-random-hash-8",
                    "some-random-hash-9",
                    "some-random-hash-10",
                    "some-random-hash-11",
                    "some-random-hash-12",
                ]);
            await batchMintTx.wait(1);
            expect(await erc721TokenContract.balanceOf(ownerSigner.getAddress())).eq("11");
        });

        it("...should allow admin to batch mint ERC721 tokenss", async () => {
            const batchMintTx = await erc721TokenContract
                .connect(adminSigner)
                .issueBatch(adminSigner.getAddress(), [
                    "some-random-hash-13",
                    "some-random-hash-14",
                    "some-random-hash-15",
                    "some-random-hash-16",
                    "some-random-hash-17",
                    "some-random-hash-18",
                    "some-random-hash-19",
                    "some-random-hash-20",
                    "some-random-hash-21",
                    "some-random-hash-22",
                ]);
            await batchMintTx.wait(1);
            expect(await erc721TokenContract.balanceOf(adminSigner.getAddress())).eq("11");
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when trying to burn token, basically transfer to 0x00 address
        */

        it("...should allow owner to burn ERC721 tokens", async () => {
            const burnTx = await erc721TokenContract.connect(ownerSigner).burn(1);
            await burnTx.wait(1);

            expect(await erc721TokenContract.balanceOf(ownerSigner.getAddress())).eq("10");
        });

        it("...should allow admin to burn ERC721 tokens", async () => {
            const burnTx = await erc721TokenContract.connect(adminSigner).burn(2);
            await burnTx.wait(1);

            expect(await erc721TokenContract.balanceOf(adminSigner.getAddress())).eq("10");
        });

        it("...should allow owner to transfer ERC721 tokens", async () => {
            const transferTx = await erc721TokenContract
                .connect(ownerSigner)
                .transferFrom(ownerSigner.getAddress(), adminSigner.getAddress(), "3");
            await transferTx.wait(1);

            expect(await erc721TokenContract.balanceOf(ownerSigner.getAddress())).eq("10");
            expect(await erc721TokenContract.balanceOf(adminSigner.getAddress())).eq("12");
        });

        it("...should allow admin to transfer ERC721 tokens", async () => {
            const approvalTx = await erc721TokenContract
                .connect(ownerSigner)
                .setApprovalForAll(adminSigner.getAddress(), true);
            await approvalTx.wait(1);
            expect(
                await erc721TokenContract.isApprovedForAll(ownerSigner.getAddress(), adminSigner.getAddress())
            ).eq(true);

            const transferTx = await erc721TokenContract
                .connect(adminSigner)
                .transferFrom(ownerSigner.getAddress(), adminSigner.getAddress(), 4);
            await transferTx.wait(1);

            expect(await erc721TokenContract.balanceOf(ownerSigner.getAddress())).eq("9");
            expect(await erc721TokenContract.balanceOf(adminSigner.getAddress())).eq("13");
        });

        it("...should allow owner to transfer the ownership of the contract to admin", async () => {
            const transferOwnershipTx = await erc721TokenContract
                .connect(ownerSigner)
                .transferOwnership(adminSigner.getAddress());
            await transferOwnershipTx.wait(1);

            expect(await erc721TokenContract.owner()).eq(adminSigner.getAddress());
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when trying to transfer ownership to 0x00 address
        */

        it("...should allow owner to renounce ownership", async () => {
            const renounceOwnershipTx = await erc721TokenContract.connect(adminSigner).renounceOwnership();
            await renounceOwnershipTx.wait(1);

            expect(await erc721TokenContract.owner()).eq("0x0000000000000000000000000000000000000000");
        });
    });
});
