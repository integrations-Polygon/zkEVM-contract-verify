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
    bobSigner,
} from "./utils/setupWallet";
import { ethers, Contract, BigNumber } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import multiSig from "../artifacts/src/multisig_contracts/MultiSigWallet.sol/MultiSigWallet.json";
import erc20 from "../artifacts/src/erc_tokens_contracts/ERC20Token.sol/TestTokenERC20.json";

describe("MultiSig Wallet deployment & tests on zkEVM", async () => {
    // declare an instance of the contracts to be deployed
    let multiSigWalletContract: any, erc20Contract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR MULTISIG WALLET\n");

        // get the contract factory
        const multiSigWalletContractFactory = new ethers.ContractFactory(
            multiSig.abi,
            multiSig.bytecode,
            ownerSigner
        );
        const erc20ContractFactory = new ethers.ContractFactory(erc20.abi, erc20.bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying MultiSig Wallet contract and sample erc20 token on zkEVM chain....");

        // deploy the multisig wallet contract
        const multiSigWallet = await multiSigWalletContractFactory.deploy([
            ownerSigner.getAddress(),
            adminSigner.getAddress(),
            userSigner.getAddress(),
            aliceSigner.getAddress(),
        ]);

        // wait for the multisig wallet contract to get deployed
        await multiSigWallet.deployed();

        // deploy the sample erc20 token contract
        const erc20Token = await erc20ContractFactory.deploy();

        // wait for the sample erc20 token contract to get deployed
        await erc20Token.deployed();

        // get the instance of the deployed multisig wallet contract
        multiSigWalletContract = new Contract(multiSigWallet.address, multiSig.abi, zkEVM_provider);

        // get the instance of the deployed sample erc20 token contract
        erc20Contract = new Contract(erc20Token.address, erc20.abi, zkEVM_provider);

        console.log("\nMultiSig Wallet contract deployed at: ", multiSigWalletContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${multiSigWalletContract.address}`
        );
        console.log("\nSample erc20 token contract deployed at: ", erc20Contract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc20Contract.address}`
        );
        console.log("\n");
    });

    describe("Setting up multisig wallet smart contract", async () => {
        it("...should allow to transfer ownership of ERC20 token smart contract to multisig wallet", async () => {
            const transferOwnershipTx = await erc20Contract
                .connect(ownerSigner)
                .transferOwnership(multiSigWalletContract.address);
            await transferOwnershipTx.wait(1);
            expect(await erc20Contract.owner()).eq(multiSigWalletContract.address);
        });

        it("...should allow owner to transfer some ERC20 token to multisig wallet address", async () => {
            const transferTx = await erc20Contract
                .connect(ownerSigner)
                .transfer(multiSigWalletContract.address, BigNumber.from("1000000000"));
            await transferTx.wait(1);
            expect(await erc20Contract.balanceOf(multiSigWalletContract.address)).eq(
                BigNumber.from("1000000000")
            );
        });
    });

    describe("MultiSig Wallet functionalities tests", async () => {
        it("...should pass check for correct owners", async () => {
            expect(await multiSigWalletContract.isOwner(ownerSigner.getAddress())).to.be.true;
            expect(await multiSigWalletContract.isOwner(adminSigner.getAddress())).to.be.true;
            expect(await multiSigWalletContract.isOwner(userSigner.getAddress())).to.be.true;
            expect(await multiSigWalletContract.isOwner(aliceSigner.getAddress())).to.be.true;
        });

        it("...should pass check for required number of confirmations 3", async () => {
            expect(await multiSigWalletContract.numConfirmationsRequired()).eq(3);
        });

        it("...should pass check for owners can submit transaction", async () => {
            const data = await multiSigWalletContract.getTransferData(adminSigner.getAddress(), 100);

            const submitTransactionTx = await multiSigWalletContract
                .connect(ownerSigner)
                .submitTransaction(erc20Contract.address, 0, data);

            await submitTransactionTx.wait(1);

            expect(await multiSigWalletContract.getTransactionCount()).eq(1);
        });

        it("...should not pass check for non-owners can submit transaction", async () => {
            const data = await multiSigWalletContract.getTransferOwnershipData(bobSigner.getAddress());

            await expect(
                multiSigWalletContract.connect(bobSigner).submitTransaction(erc20Contract.address, 0, data)
            ).to.revertedWith("not owner");
        });

        it("...should pass check for owners can confirm transaction", async () => {
            const ownerConfirmationTx = await multiSigWalletContract
                .connect(ownerSigner)
                .confirmTransaction(0);
            await ownerConfirmationTx.wait(1);
            expect(await multiSigWalletContract.isConfirmed(0, ownerSigner.getAddress())).to.be.true;

            const adminConfirmationTx = await multiSigWalletContract
                .connect(adminSigner)
                .confirmTransaction(0);
            await adminConfirmationTx.wait(1);
            expect(await multiSigWalletContract.isConfirmed(0, adminSigner.getAddress())).to.be.true;

            const userConfirmationTx = await multiSigWalletContract.connect(userSigner).confirmTransaction(0);
            await userConfirmationTx.wait(1);
            expect(await multiSigWalletContract.isConfirmed(0, userSigner.getAddress())).to.be.true;

            expect(await (await multiSigWalletContract.getTransaction(0)).numConfirmations).eq(
                await multiSigWalletContract.numConfirmationsRequired()
            );
        });

        it("...should not pass check for non-owners can confirm transaction", async () => {
            await expect(multiSigWalletContract.connect(bobSigner).confirmTransaction(0)).to.revertedWith(
                "not owner"
            );
        });

        /*  
            Error: (Awaiting internal transactions for reason)
            when trying to revoke confirmation from 1 to 0
        */

        it("...should pass check for owners can revoke confirmation", async () => {
            const revokeConfirmationTx = await multiSigWalletContract
                .connect(adminSigner)
                .revokeConfirmation(0);
            await revokeConfirmationTx.wait(1);
            expect(await multiSigWalletContract.isConfirmed(0, adminSigner.getAddress())).eq(false);

            // REVERT REVOKE CONFIRMATION
            const confirmationTx = await multiSigWalletContract.connect(adminSigner).confirmTransaction(0);
            await confirmationTx.wait(1);
            expect(await multiSigWalletContract.isConfirmed(0, adminSigner.getAddress())).eq(true);
        });

        it("...should not pass check for non-owners can revoke confiramtion", async () => {
            await expect(multiSigWalletContract.connect(bobSigner).revokeConfirmation(0)).to.revertedWith(
                "not owner"
            );
        });

        it("...should not pass check for non-owners can execute transaction", async () => {
            await expect(multiSigWalletContract.connect(bobSigner).executeTransaction(0)).to.revertedWith(
                "not owner"
            );
        });

        it("...should pass check for owners can execute transaction", async () => {
            const executeTx = await multiSigWalletContract.connect(ownerSigner).executeTransaction(0);
            await executeTx.wait(1);

            expect(await (await multiSigWalletContract.getTransaction(0)).executed).to.be.true;
        });
    });
});
