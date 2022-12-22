import {
    setupWallet,
    zkEVM_provider,
    ownerSigner,
    adminSigner,
    userSigner,
    aliceSigner,
    bobSigner,
} from "./utils/setupWallet";
import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import ERC20Token_artifacts from "../artifacts/src/marketplace_contracts/tokens/ERC20Token.sol/ERC20Token.json";
import ERC721Token_artifacts from "../artifacts/src/marketplace_contracts/tokens/ERC721Token.sol/ERC721Token.json";
import ERC721TokenLender_artifacts from "../artifacts/src/marketplace_contracts/tokens/ERC721Token_lender.sol/ERC721Token.json";
import NFTLend_artifacts from "../artifacts/src/marketplace_contracts/NFTLend.sol/Lend.json";

describe("NFTLend contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let nftContract: any;
    let nftLendContract: any;
    let lendContract: any;
    let tokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\n-----------------------------------------------------------------------------");
        console.log("Deploying NFTLend smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------\n");

        /* 
            check & display current balances
        */
        await checkBalances(derivedNode);

        /* 
            GET THE CONTRACT FACTORY
        */
        const token_Factory = new ethers.ContractFactory(
            ERC20Token_artifacts.abi,
            ERC20Token_artifacts.bytecode,
            ownerSigner
        );

        const nft_Factory = new ethers.ContractFactory(
            ERC721Token_artifacts.abi,
            ERC721Token_artifacts.bytecode,
            ownerSigner
        );

        const nftLend_Factory = new ethers.ContractFactory(
            ERC721TokenLender_artifacts.abi,
            ERC721TokenLender_artifacts.bytecode,
            ownerSigner
        );

        const lend_Factory = new ethers.ContractFactory(
            NFTLend_artifacts.abi,
            NFTLend_artifacts.bytecode,
            ownerSigner
        );

        /* 
            DEPLOY THE CONTRACTS 
        */
        const token_contract = await token_Factory.deploy();
        await token_contract.deployed();

        const nft_contract = await nft_Factory.deploy();
        await nft_contract.deployed();

        const nftLend_contract = await nftLend_Factory.deploy();
        await nftLend_contract.deployed();

        const lend_contract = await lend_Factory.deploy(
            token_contract.address,
            nft_contract.address,
            await adminSigner.getAddress(),
            nftLend_contract.address
        );
        await lend_contract.deployed();

        /* 
            GET THE INSTANCE OF THE DEPLOYED CONTRACT 
        */
        tokenContract = new Contract(token_contract.address, ERC20Token_artifacts.abi, zkEVM_provider);
        nftContract = new Contract(nft_contract.address, ERC721Token_artifacts.abi, zkEVM_provider);
        nftLendContract = new Contract(
            nftLend_contract.address,
            ERC721TokenLender_artifacts.abi,
            zkEVM_provider
        );
        lendContract = new Contract(lend_contract.address, NFTLend_artifacts.abi, zkEVM_provider);

        console.log("\nERC20 token Contract Deployed at: ", tokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${tokenContract.address}`
        );
        console.log("\n");
        console.log("ERC721 token Contract Deployed at: ", nftContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${nftContract.address}`
        );
        console.log("\n");
        console.log("ERC721 token 2 Contract Deployed at: ", nftLendContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${nftLendContract.address}`
        );
        console.log("\n");
        console.log("NFTLend Contract Deployed at: ", lendContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${lendContract.address}`
        );
    });

    describe("Setting up NFTLend smart contract", async () => {
        it("...should be able to transfer some ERC20 tokens to alice", async () => {
            const transferToken_alice = await tokenContract
                .connect(ownerSigner)
                .transfer(aliceSigner.getAddress(), "10000");
            await transferToken_alice.wait();
            expect(await tokenContract.balanceOf(await aliceSigner.getAddress())).eq("10000");
        });

        it("...should be able to transfer some ERC20 tokens to bob", async () => {
            const transferToken_bob = await tokenContract
                .connect(ownerSigner)
                .transfer(bobSigner.getAddress(), "10000");
            await transferToken_bob.wait();
            expect(await tokenContract.balanceOf(await bobSigner.getAddress())).eq("10000");
        });

        it("...should be able to transfer some ERC20 tokens to NFTLend smart contract", async () => {
            const transferToken_lendContract = await tokenContract
                .connect(ownerSigner)
                .transfer(lendContract.address, "10000");
            await transferToken_lendContract.wait();
            expect(await tokenContract.balanceOf(lendContract.address)).eq("10000");
        });

        it("...should be able to whitelist owner on ERC721 token smart contract", async () => {
            const whitelist_owner = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(ownerSigner.getAddress());
            await whitelist_owner.wait();
            expect(await nftContract.checkWhitelist(await ownerSigner.getAddress())).eq(true);
        });

        it("...should be able to whitelist alice on ERC721 token smart contract", async () => {
            const whitelist_alice = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(aliceSigner.getAddress());
            await whitelist_alice.wait();
            expect(await nftContract.checkWhitelist(await aliceSigner.getAddress())).eq(true);
        });

        it("...should be able to whitelist bob on ERC721 token smart contract", async () => {
            const whitelist_bob = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(bobSigner.getAddress());
            await whitelist_bob.wait();
            expect(await nftContract.checkWhitelist(await bobSigner.getAddress())).eq(true);
        });

        it("...should be able to whitelist NFTLend smart contract on ERC721 token smart contract", async () => {
            const whitelist_lendContract = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(lendContract.address);
            await whitelist_lendContract.wait();
            expect(await nftContract.checkWhitelist(lendContract.address)).eq(true);
        });

        it("...should be able to whitelist owner on ERC721_lender token smart contract", async () => {
            const whitelist_owner = await nftLendContract
                .connect(ownerSigner)
                .addToWhitelist(ownerSigner.getAddress());
            await whitelist_owner.wait();
            expect(await nftLendContract.checkWhitelist(await ownerSigner.getAddress())).eq(true);
        });

        it("...should be able to whitelist alice on ERC721_lender token smart contract", async () => {
            const whitelist_alice = await nftLendContract
                .connect(ownerSigner)
                .addToWhitelist(aliceSigner.getAddress());
            await whitelist_alice.wait();
            expect(await nftLendContract.checkWhitelist(await aliceSigner.getAddress())).eq(true);
        });

        it("...should be able to whitelist bob on ERC721_lender token smart contract", async () => {
            const whitelist_bob = await nftLendContract
                .connect(ownerSigner)
                .addToWhitelist(bobSigner.getAddress());
            await whitelist_bob.wait();
            expect(await nftLendContract.checkWhitelist(await bobSigner.getAddress())).eq(true);
        });

        it("...should be able to whitelist NFTLend smart contract on ERC721_lender token smart contract", async () => {
            const whitelist_lendContract = await nftLendContract
                .connect(ownerSigner)
                .addToWhitelist(lendContract.address);
            await whitelist_lendContract.wait();
            expect(await nftLendContract.checkWhitelist(lendContract.address)).eq(true);
        });

        it("...should be able to mint ERC721 token with tokenID 1 to alice", async () => {
            const issueToken_1 = await nftContract
                .connect(ownerSigner)
                .issueToken(aliceSigner.getAddress(), 1, `hash-01`);
            await issueToken_1.wait();
            expect(await nftContract.ownerOf(1)).eq(await aliceSigner.getAddress());
        });

        it("...should be able to mint ERC721 token with tokenID 2 to alice", async () => {
            const issueToken_2 = await nftContract
                .connect(ownerSigner)
                .issueToken(aliceSigner.getAddress(), 2, `hash-02`);
            await issueToken_2.wait();
            expect(await nftContract.ownerOf(1)).eq(await aliceSigner.getAddress());
        });

        it("...should be able to mint ERC721 token with tokenID 3 to alice", async () => {
            const issueToken_3 = await nftContract
                .connect(ownerSigner)
                .issueToken(aliceSigner.getAddress(), 3, `hash-03`);
            await issueToken_3.wait();
            expect(await nftContract.ownerOf(1)).eq(await aliceSigner.getAddress());
        });

        it("...should be able to set lender address on ERC721_lender token smart contract", async () => {
            const setLender = await nftLendContract
                .connect(ownerSigner)
                .setLenderContractAddress(lendContract.address);
            await setLender.wait();
            expect(await nftLendContract.connect(ownerSigner).getLenderContractAddress()).eq(
                lendContract.address
            );
        });
    });

    describe("NFTLend contract functionalities tests", async () => {
        it("...should have correct NFT address", async () => {
            expect(await lendContract.nftAddress()).to.eq(nftContract.address);
        });

        it("...should not allow lender to list NFT for Lending without granting approval", async () => {
            await expect(lendContract.connect(aliceSigner).lendNft([1], 1000, 1000, 100)).to.revertedWith(
                "ERC721: caller is not token owner nor approved"
            );
        });

        it("...should allow lender to list NFT for lending", async () => {
            const approveResult = await nftContract.connect(aliceSigner).approve(lendContract.address, 1);
            await approveResult.wait();

            const saleResult = await lendContract.connect(aliceSigner).lendNft([1], 1000, 50, 100);
            await saleResult.wait();
            expect(await nftContract.ownerOf(1)).eq(lendContract.address);
        });

        it("...should allow renter to Rent NFT", async () => {
            let approveResult2 = await tokenContract.connect(bobSigner).approve(lendContract.address, 1000);
            await approveResult2.wait();

            let purchaseResult = await lendContract.connect(bobSigner).rentNft(1);
            await purchaseResult.wait();
            expect(await nftLendContract.ownerOf(1)).to.eq(await bobSigner.getAddress());
        });

        it("...should not allow lender to cancel sale if the NFT is lended", async () => {
            await expect(lendContract.connect(aliceSigner).cancelLendNft(1)).to.revertedWith(
                "NFT is already Lended"
            );
        });

        it("...should not allow renter to transfer the nftLend", async () => {
            await expect(
                nftLendContract
                    .connect(bobSigner)
                    .transferFrom(await bobSigner.getAddress(), await userSigner.getAddress(), 1)
            ).to.revertedWith("NFT transfer isn't allowed");
        });

        it("...should not allow renter to burn the Game nftLend", async () => {
            await expect(nftLendContract.connect(bobSigner).burn(1)).to.revertedWith(
                "You cannot burn your own token"
            );
        });

        /*
            AWAITING INTERNAL TRANSACTION EROR
        */

        it("...should allow lender to cancel Lend", async () => {
            const approveResult = await nftContract.connect(aliceSigner).approve(lendContract.address, 2);
            await approveResult.wait();

            const saleResult = await lendContract.connect(aliceSigner).lendNft([2], 1000, 1000, 100);
            await saleResult.wait();
            expect(await nftContract.ownerOf(2)).to.eq(lendContract.address);

            const cancelledResult = await lendContract.connect(aliceSigner).cancelLendNft(2);
            await cancelledResult.wait();
            expect(await nftContract.ownerOf(2)).to.eq(await aliceSigner.getAddress());
        });

        it("...should not allow lender to claim NFT before its duration (1000000) is over", async () => {
            const approveResult = await nftContract.connect(aliceSigner).approve(lendContract.address, 3);
            await approveResult.wait();

            const saleResult = await lendContract.connect(aliceSigner).lendNft([3], 1000, 1000000, 100);
            await saleResult.wait();
            expect(await nftContract.ownerOf(3)).to.eq(lendContract.address);

            const approveResult2 = await tokenContract
                .connect(aliceSigner)
                .approve(lendContract.address, 1000);
            await approveResult2.wait();

            const purchaseResult = await lendContract.connect(aliceSigner).rentNft(3);
            await purchaseResult.wait();
            expect(await nftLendContract.ownerOf(3)).to.eq(await aliceSigner.getAddress());

            await expect(lendContract.connect(aliceSigner).claimNft(3)).to.be.revertedWith(
                "Lending time isn't over yet"
            );
        });
    });
});
