import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner, adminSigner } from "./utils/setupWallet";
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

        console.log("\nERC1155 Token contract deployed at: ", erc1155TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc1155TokenContract.address}`
        );
        console.log("\n");
    });

    describe("ERC1155 Token Token functionalities tests", async () => {
        it("has correct uri", async () => {
            expect(await erc1155TokenContract.uri(0)).eq("ipfs://some-random-hash/");
        });

        it("owner can set admin", async () => {
            const setAdminTx = await erc1155TokenContract
                .connect(ownerSigner)
                .setAdmin(derivedNode[1].address, "true");
            await setAdminTx.wait(1);

            expect(await erc1155TokenContract.isAdmin(derivedNode[1].address)).eq(true);
        });

        it("owner can mint tokens", async () => {
            const mintTx = await erc1155TokenContract
                .connect(ownerSigner)
                .mintTestERC1155(derivedNode[0].address, ethers.utils.parseEther("5"));
            await mintTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 1)).eq(
                ethers.utils.parseEther("5")
            );
        });

        it("owner can batch mint tokens", async () => {
            const batchMintTx = await erc1155TokenContract
                .connect(ownerSigner)
                .mintBatchTestERC1155(derivedNode[0].address, [1, 20, 5, 1, 10, 1, 22, 4, 1, 50]);
            await batchMintTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 2)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 3)).eq(20);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 4)).eq(5);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 5)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 6)).eq(10);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 7)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 8)).eq(22);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 9)).eq(4);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 10)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[0].address, 11)).eq(50);
        });

        it("admin can batch mint tokens", async () => {
            const batchMintTx = await erc1155TokenContract
                .connect(adminSigner)
                .mintBatchTestERC1155(derivedNode[1].address, [1, 20, 5, 1, 10, 1, 22, 4, 1, 50]);
            await batchMintTx.wait(1);

            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 12)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 13)).eq(20);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 14)).eq(5);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 15)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 16)).eq(10);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 17)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 18)).eq(22);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 19)).eq(4);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 20)).eq(1);
            expect(await erc1155TokenContract.balanceOf(derivedNode[1].address, 21)).eq(50);
        });
    });
});
