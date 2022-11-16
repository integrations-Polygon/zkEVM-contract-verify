import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, adminSigner, userSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/ERC1155Token.sol/TestTokenERC1155.json";

describe("ERC1155 Token deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc1155TokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR STANDARD ERC1155 TOKEN\n");

        // get the contract factory
        const erc1155TokenFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC1155 Token smart contract on zkEVM chain....");

        // deploy the contract
        const erc1155Token = await erc1155TokenFactory.deploy();

        // wait for the contract to get deployed
        await erc1155Token.deployed();

        // get the instance of the deployed contract
        erc1155TokenContract = new Contract(erc1155Token.address, abi, zkEVM_provider);

        console.log("\nERC1155 token contract deployed at: ", erc1155TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc1155TokenContract.address}`
        );
        console.log("\n");
    });

    describe("ERC1155 Token functionalities tests", async () => {
        it("...has correct uri", async () => {
            expect(await erc1155TokenContract.uri(0)).eq("ipfs://some-random-hash/");
        });

        it("...should allow owner to set admin", async () => {
            const setAdminTx = await erc1155TokenContract
                .connect(ownerSigner)
                .setAdmin(derivedNode[1].address, "true");
            await setAdminTx.wait(1);

            expect(await erc1155TokenContract.isAdmin(derivedNode[1].address)).eq(true);
        });

        it("...should allow owner to mint ERC1155 tokens", async () => {
            const mintTx = await erc1155TokenContract
                .connect(ownerSigner)
                .mintTestERC1155(derivedNode[0].address, ethers.utils.parseEther("5"));
            await mintTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 1)).eq(
                ethers.utils.parseEther("5")
            );
        });

        it("...should allow owner to batch mint ERC1155 tokens", async () => {
            const batchMintTx = await erc1155TokenContract
                .connect(ownerSigner)
                .mintBatchTestERC1155(derivedNode[0].address, [1, 20, 5, 1, 10, 1, 22, 4, 1, 50]);
            await batchMintTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 11)).eq(50);
        });

        it("...should allow admin to batch mint ERC1155 tokens", async () => {
            const batchMintTx = await erc1155TokenContract
                .connect(adminSigner)
                .mintBatchTestERC1155(derivedNode[1].address, [1, 20, 5, 1, 10, 1, 22, 4, 1, 50]);
            await batchMintTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 12)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 21)).eq(50);
        });

        it("...should allow owner to transfer ERC1155 token", async () => {
            const safeTransferFromTx = await erc1155TokenContract
                .connect(ownerSigner)
                .safeTransferFrom(
                    derivedNode[0].address,
                    derivedNode[2].address,
                    1,
                    ethers.utils.parseEther("5"),
                    "0x00"
                );
            await safeTransferFromTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[2].address, 1)).eq(
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
                    derivedNode[0].address,
                    derivedNode[2].address,
                    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    [1, 20, 5, 1, 10, 1, 22, 4, 1, 50],
                    "0x00"
                );
            await safeBatchTransferFromTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[2].address, 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[2].address, 11)).eq(50);
        });

        it("...should allow user to transfer ERC1155 token", async () => {
            const safeTransferFromTx = await erc1155TokenContract
                .connect(userSigner)
                .safeTransferFrom(
                    derivedNode[2].address,
                    derivedNode[3].address,
                    1,
                    ethers.utils.parseEther("5"),
                    "0x00"
                );
            await safeTransferFromTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[3].address, 1)).eq(
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
                    derivedNode[2].address,
                    derivedNode[3].address,
                    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    [1, 20, 5, 1, 10, 1, 22, 4, 1, 50],
                    "0x00"
                );
            await safeBatchTransferFromTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[3].address, 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[3].address, 11)).eq(50);
        });

        it("...should allow owner to transfer the ownership of the contract to admin", async () => {
            const transferOwnershipTx = await erc1155TokenContract
                .connect(ownerSigner)
                .transferOwnership(derivedNode[1].address);
            await transferOwnershipTx.wait(1);

            expect(await erc1155TokenContract.owner()).eq(derivedNode[1].address);
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when trying to transfer ownership to 0x00 address
        */

        it("...should allow owner to renounce ownership", async () => {
            const renounceOwnershipTx = await erc1155TokenContract.connect(adminSigner).renounceOwnership();
            await renounceOwnershipTx.wait(1);

            expect(await erc1155TokenContract.owner()).eq("0x0000000000000000000000000000000000000000");
        });
    });
});
