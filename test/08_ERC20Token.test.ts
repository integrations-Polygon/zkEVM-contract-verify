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
import { abi, bytecode } from "../artifacts/src/erc_tokens_contracts/ERC20Token.sol/TestTokenERC20.json";

describe("ERC20 token deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc20TokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR STANDARD ERC20 TOKEN\n");

        // get the contract factory
        const erc20TokenFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC20 token smart contract on zkEVM chain....");

        // deploy the contract
        const erc20Token = await erc20TokenFactory.deploy();

        // wait for the contract to get deployed
        await erc20Token.deployed();

        // get the instance of the deployed contract
        erc20TokenContract = new Contract(erc20Token.address, abi, zkEVM_provider);

        console.log("\nERC20 token contract deployed at: ", erc20TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc20TokenContract.address}`
        );
        console.log("\n");
    });

    describe("ERC20 token functionalities tests", async () => {
        it("...has correct token name", async () => {
            expect(await erc20TokenContract.name()).eq("ERC20 Test Token");
        });

        it("...has correct token symbol", async () => {
            expect(await erc20TokenContract.symbol()).eq("TT20");
        });

        it("...should mint ERC20 tokens on deployment", async () => {
            expect(await erc20TokenContract.balanceOf(ownerSigner.getAddress())).eq(
                ethers.utils.parseEther("1000000000")
            );
        });

        it("...can mint ERC20 tokens", async () => {
            const mintTx = await erc20TokenContract
                .connect(ownerSigner)
                .mintERC20(aliceSigner.getAddress(), ethers.utils.parseEther("10"));
            await mintTx.wait(1);
            expect(await erc20TokenContract.balanceOf(aliceSigner.getAddress())).eq(
                ethers.utils.parseEther("10")
            );
        });

        it("...should allow owner to transfer ERC20 tokens to other address", async () => {
            const transferTx = await erc20TokenContract
                .connect(ownerSigner)
                .transfer(adminSigner.getAddress(), ethers.utils.parseEther("1"));
            await transferTx.wait(1);
            expect(await erc20TokenContract.balanceOf(adminSigner.getAddress())).eq(
                ethers.utils.parseEther("1")
            );
        });

        it("...should not allow to transfer ERC20 tokens if insufficient balance", async () => {
            await expect(
                erc20TokenContract
                    .connect(userSigner)
                    .transfer(aliceSigner.getAddress(), ethers.utils.parseEther("1000"))
            ).to.be.reverted;
        });

        it("...should not allow transferring to 0 address", async () => {
            await expect(erc20TokenContract.transfer(ethers.constants.AddressZero, 100)).to.be.reverted;
        });

        it("...can sets correct allowance", async () => {
            const approveTx = await erc20TokenContract
                .connect(ownerSigner)
                .approve(userSigner.getAddress(), ethers.utils.parseEther("1"));
            await approveTx.wait(1);

            expect(await erc20TokenContract.allowance(ownerSigner.getAddress(), userSigner.getAddress())).eq(
                ethers.utils.parseEther("1")
            );
        });

        it("...should allows to transferFrom", async () => {
            const transferTx = await erc20TokenContract
                .connect(userSigner)
                .transferFrom(ownerSigner.getAddress(), userSigner.getAddress(), 1000);
            await transferTx.wait(1);

            expect(await erc20TokenContract.balanceOf(userSigner.getAddress())).eq(1000);
        });

        it("...should not allow to transferFrom if insufficient allowance", async () => {
            const tx = await erc20TokenContract
                .connect(ownerSigner)
                .approve(aliceSigner.getAddress(), ethers.utils.parseEther("1"));
            await tx.wait(1);
            await expect(
                erc20TokenContract
                    .connect(aliceSigner)
                    .transferFrom(
                        ownerSigner.getAddress(),
                        aliceSigner.getAddress(),
                        ethers.utils.parseEther("10000")
                    )
            ).to.be.reverted;
        });
    });
});
