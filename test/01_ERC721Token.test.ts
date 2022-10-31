import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallets, zkEVM_provider, ownerSigner, adminSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/ERC721Token.sol/TestTokenERC721.json";

describe("ERC721 Token deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc721TokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallets();

    before(async () => {
        console.log("\n\nAUTOMATE UNIT TEST CASES FOR STANDARD ERC721 TOKEN\n");

        // get the contract factory
        const erc721TokenFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC721 Token smart contract on zkEVM chain....");

        // deploy the contract
        const erc721Token = await erc721TokenFactory.deploy();

        // wait for the contract to get deployed
        await erc721Token.deployed();

        // get the instance of the deployed contract
        erc721TokenContract = new Contract(erc721Token.address, abi, zkEVM_provider);

        console.log("\nERC721 Token contract deployed at: ", erc721TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc721TokenContract.address}`
        );
        console.log("\n");
    });

    describe("ERC721 Token Token functionalities tests", async () => {
        it("has correct token name", async () => {
            expect(await erc721TokenContract.name()).eq("Test ERC721 Token");
        });

        it("has correct token symbol", async () => {
            expect(await erc721TokenContract.symbol()).eq("TT721");
        });

        it("can set an admin", async () => {
            const setAdminTx = await erc721TokenContract
                .connect(ownerSigner)
                .setAdmin(derivedNode[1].address, "true");
            await setAdminTx.wait(1);
            expect(await erc721TokenContract.isAdmin(derivedNode[1].address)).eq(true);
        });

        it("owner can mint tokens", async () => {
            const mintTx = await erc721TokenContract
                .connect(ownerSigner)
                .issueToken(derivedNode[0].address, "some-random-hash-1");
            await mintTx.wait(1);
            expect(await erc721TokenContract.balanceOf(derivedNode[0].address)).eq("1");
        });

        it("admin can mint tokens", async () => {
            const mintTx = await erc721TokenContract
                .connect(adminSigner)
                .issueToken(derivedNode[1].address, "some-random-hash-2");
            await mintTx.wait(1);
            expect(await erc721TokenContract.balanceOf(derivedNode[1].address)).eq("1");
        });

        it("owner can batch mint tokens", async () => {
            const batchMintTx = await erc721TokenContract
                .connect(ownerSigner)
                .issueBatch(derivedNode[0].address, [
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
            expect(await erc721TokenContract.balanceOf(derivedNode[0].address)).eq("11");
        });

        it("admin can batch mint tokens", async () => {
            const batchMintTx = await erc721TokenContract
                .connect(adminSigner)
                .issueBatch(derivedNode[1].address, [
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
            expect(await erc721TokenContract.balanceOf(derivedNode[1].address)).eq("11");
        });

        // it("owner can burn token", async () => {
        //     const burnTx = await erc721TokenContract.connect(ownerSigner).burn(1);
        //     await burnTx.wait(1);

        //     expect(await erc721TokenContract.balanceOf(derivedNode[0].address)).eq("10");
        // });

        // it("admin can burn token", async () => {
        //     const burnTx = await erc721TokenContract.connect(adminSigner).burn(2);
        //     await burnTx.wait(1);

        //     expect(await erc721TokenContract.balanceOf(derivedNode[1].address)).eq("10");
        // });

        it("owner can transfer erc721 token", async () => {
            const transferTx = await erc721TokenContract
                .connect(ownerSigner)
                .transferFrom(derivedNode[0].address, derivedNode[1].address, "3");
            await transferTx.wait(1);

            expect(await erc721TokenContract.balanceOf(derivedNode[0].address)).eq("10");
            expect(await erc721TokenContract.balanceOf(derivedNode[1].address)).eq("12");
        });

        it("admin can transfer erc721 token", async () => {
            const approvalTx = await erc721TokenContract
                .connect(ownerSigner)
                .setApprovalForAll(derivedNode[1].address, true);
            await approvalTx.wait(1);
            expect(
                await erc721TokenContract.isApprovedForAll(derivedNode[0].address, derivedNode[1].address)
            ).eq(true);

            const transferTx = await erc721TokenContract
                .connect(adminSigner)
                .transferFrom(derivedNode[0].address, derivedNode[1].address, 4);
            await transferTx.wait(1);

            expect(await erc721TokenContract.balanceOf(derivedNode[0].address)).eq("9");
            expect(await erc721TokenContract.balanceOf(derivedNode[1].address)).eq("13");
        });

        it("owner can transfer the ownership to admin", async () => {
            const transferOwnershipTx = await erc721TokenContract
                .connect(ownerSigner)
                .transferOwnership(derivedNode[1].address);
            await transferOwnershipTx.wait(1);

            expect(await erc721TokenContract.owner()).eq(derivedNode[1].address);
        });

        // it("owner can renounce ownership", async () => {
        //     const renounceOwnershipTx = await erc721TokenContract.connect(adminSigner).renounceOwnership();
        //     await renounceOwnershipTx.wait(1);

        //     expect(await erc721TokenContract.owner()).eq("0x0000000000000000000000000000000000000000");
        // });
    });
});
