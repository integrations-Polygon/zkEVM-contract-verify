import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import {
    setupWallet,
    zkEVM_provider,
    ownerSigner,
    adminSigner,
    userSigner,
    aliceSigner,
} from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/erc_tokens_contracts/ERC1155Token.sol/TestTokenERC1155.json";

describe("ERC1155 Token deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc1155TokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        // console.log("\nAUTOMATE UNIT TEST CASES FOR STANDARD ERC1155 TOKEN\n");

        // get the contract factory
        const erc1155TokenFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        // console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\n-----------------------------------------------------------------------------");
        console.log("Deploying ERC1155 Token smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------\n");

        // deploy the contract
        const erc1155Token = await erc1155TokenFactory.deploy();

        // wait for the contract to get deployed
        await erc1155Token.deployed();

        // get the instance of the deployed contract
        erc1155TokenContract = new Contract(erc1155Token.address, abi, zkEVM_provider);

        console.log("ERC1155 token Contract Deployed at: ", erc1155TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc1155TokenContract.address}`
        );
    });

    describe("ERC1155 token functionalities tests", async () => {
        it("...has correct uri", async () => {
            expect(await erc1155TokenContract.uri(0)).eq("ipfs://some-random-hash/");
        });

        it("...should allow owner to set admin", async () => {
            const setAdminTx = await erc1155TokenContract
                .connect(ownerSigner)
                .setAdmin(adminSigner.getAddress(), "true");
            await setAdminTx.wait();

            expect(await erc1155TokenContract.isAdmin(adminSigner.getAddress())).eq(true);
        });

        it("...should allow owner to mint ERC1155 tokens", async () => {
            const mintTx = await erc1155TokenContract
                .connect(ownerSigner)
                .mintTestERC1155(ownerSigner.getAddress(), ethers.utils.parseEther("5"));
            await mintTx.wait();

            expect(await erc1155TokenContract.balanceOf(ownerSigner.getAddress(), 1)).eq(
                ethers.utils.parseEther("5")
            );
        });

        it("...should allow owner to batch mint ERC1155 tokens", async () => {
            const batchMintTx = await erc1155TokenContract
                .connect(ownerSigner)
                .mintBatchTestERC1155(ownerSigner.getAddress(), [1, 20, 5, 1, 10, 1, 22, 4, 1, 50]);
            await batchMintTx.wait();

            expect(await erc1155TokenContract.balanceOf(ownerSigner.getAddress(), 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(ownerSigner.getAddress(), 11)).eq(50);
        });

        it("...should allow admin to batch mint ERC1155 tokens", async () => {
            const batchMintTx = await erc1155TokenContract
                .connect(adminSigner)
                .mintBatchTestERC1155(adminSigner.getAddress(), [1, 20, 5, 1, 10, 1, 22, 4, 1, 50]);
            await batchMintTx.wait();

            expect(await erc1155TokenContract.balanceOf(adminSigner.getAddress(), 12)).eq(1);
            expect(await erc1155TokenContract.balanceOf(adminSigner.getAddress(), 21)).eq(50);
        });

        it("...should allow owner to transfer ERC1155 token", async () => {
            const safeTransferFromTx = await erc1155TokenContract
                .connect(ownerSigner)
                .safeTransferFrom(
                    ownerSigner.getAddress(),
                    userSigner.getAddress(),
                    1,
                    ethers.utils.parseEther("5"),
                    "0x00"
                );
            await safeTransferFromTx.wait();

            expect(await erc1155TokenContract.balanceOf(userSigner.getAddress(), 1)).eq(
                ethers.utils.parseEther("5")
            );
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when passing more than one value in the array
        */

        it("...should allow owner to batch transfer ERC1155 tokens", async () => {
            const safeBatchTransferFromTx = await erc1155TokenContract
                .connect(ownerSigner)
                .safeBatchTransferFrom(
                    ownerSigner.getAddress(),
                    userSigner.getAddress(),
                    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    [1, 20, 5, 1, 10, 1, 22, 4, 1, 50],
                    "0x00"
                );
            await safeBatchTransferFromTx.wait();

            expect(await erc1155TokenContract.balanceOf(userSigner.getAddress(), 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(userSigner.getAddress(), 11)).eq(50);
        });

        it("...should allow user to transfer ERC1155 token", async () => {
            const safeTransferFromTx = await erc1155TokenContract
                .connect(userSigner)
                .safeTransferFrom(
                    userSigner.getAddress(),
                    aliceSigner.getAddress(),
                    1,
                    ethers.utils.parseEther("5"),
                    "0x00"
                );
            await safeTransferFromTx.wait();

            expect(await erc1155TokenContract.balanceOf(aliceSigner.getAddress(), 1)).eq(
                ethers.utils.parseEther("5")
            );
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when passing more than one value in the array
        */

        it("...should allow user to batch transfer ERC1155 tokens", async () => {
            const safeBatchTransferFromTx = await erc1155TokenContract
                .connect(userSigner)
                .safeBatchTransferFrom(
                    userSigner.getAddress(),
                    aliceSigner.getAddress(),
                    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    [1, 20, 5, 1, 10, 1, 22, 4, 1, 50],
                    "0x00"
                );
            await safeBatchTransferFromTx.wait();

            expect(await erc1155TokenContract.balanceOf(aliceSigner.getAddress(), 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(aliceSigner.getAddress(), 11)).eq(50);
        });

        it("...should allow owner to transfer the ownership of the contract to admin", async () => {
            const transferOwnershipTx = await erc1155TokenContract
                .connect(ownerSigner)
                .transferOwnership(adminSigner.getAddress());
            await transferOwnershipTx.wait();

            expect(await erc1155TokenContract.owner()).eq(await adminSigner.getAddress());
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when trying to transfer ownership to 0x00 address
        */

        it("...should allow owner to renounce ownership", async () => {
            const renounceOwnershipTx = await erc1155TokenContract.connect(adminSigner).renounceOwnership();
            await renounceOwnershipTx.wait();

            expect(await erc1155TokenContract.owner()).eq("0x0000000000000000000000000000000000000000");
        });
    });
});
