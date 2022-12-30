import { setupWallet, zkEVM_provider, ownerSigner, aliceSigner, bobSigner } from "./utils/setupWallet";
import { sleep } from "./utils/wait";
import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/marketplace_contracts/NFTAuction.sol/NFTAuction.json";
import ERC721Token_artifacts from "../artifacts/src/marketplace_contracts/tokens/ERC721Token.sol/ERC721Token.json";

describe("NFTAuction contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let nftContract: any;
    let auctionContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();

    before(async () => {
        console.log("\n-----------------------------------------------------------------------------------");
        console.log("Deploying NFTAuction smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------------\n");

        /* 
            check & display current balances
        */
        await checkBalances(derivedNode);

        /* 
            GET THE CONTRACT FACTORY
        */
        const nft_Factory = new ethers.ContractFactory(
            ERC721Token_artifacts.abi,
            ERC721Token_artifacts.bytecode,
            ownerSigner
        );
        const auction_Factory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        /* 
            DEPLOY THE CONTRACTS 
        */
        const nft_contract = await nft_Factory.deploy();
        await nft_contract.deployed();

        const auction_contract = await auction_Factory.deploy(
            nft_contract.address,
            1,
            ethers.utils.parseEther("0.0001")
        );
        await auction_contract.deployed();

        /* 
            GET THE INSTANCE OF THE DEPLOYED CONTRACT 
        */
        nftContract = new Contract(nft_contract.address, ERC721Token_artifacts.abi, zkEVM_provider);
        auctionContract = new Contract(auction_contract.address, abi, zkEVM_provider);

        console.log("\nERC721 token Contract Deployed at: ", nftContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${nftContract.address}`
        );
        console.log("\n");
        console.log("NFTAuction Contract Deployed at: ", auctionContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${auctionContract.address}`
        );
        console.log("\n\n");
    });
    describe("Setting up NFTAuction smart contract", async () => {
        it("...should be able to mint ERC721 NFT with tokenID 1 to seller or owner", async () => {
            const issueToken = await nftContract
                .connect(ownerSigner)
                .issueToken(ownerSigner.getAddress(), 1, "hash-01");
            await issueToken.wait(2);
            expect(await nftContract.ownerOf(1)).eq(await ownerSigner.getAddress());
        });

        it("...should allow ERC721 token to setApprovalForAll true for auction contract address", async () => {
            const approval = await nftContract
                .connect(ownerSigner)
                .setApprovalForAll(auctionContract.address, true);
            await approval.wait(2);
            expect(
                await nftContract.isApprovedForAll(await ownerSigner.getAddress(), auctionContract.address)
            ).eq(true);
        });

        it("...should allow ERC721 token to whitelist NFTAuction smart contract", async () => {
            const whitelist_lendContract = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(auctionContract.address);
            await whitelist_lendContract.wait(2);
            expect(await nftContract.checkWhitelist(auctionContract.address)).eq(true);
        });

        it("...should allow ERC721 token to whitelist alice bidder", async () => {
            const whitelist_lendContract = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(await aliceSigner.getAddress());
            await whitelist_lendContract.wait(2);
            expect(await nftContract.checkWhitelist(await aliceSigner.getAddress())).eq(true);
        });

        it("...should allow ERC721 token to whitelist bob bidder", async () => {
            const whitelist_lendContract = await nftContract
                .connect(ownerSigner)
                .addToWhitelist(await bobSigner.getAddress());
            await whitelist_lendContract.wait(2);
            expect(await nftContract.checkWhitelist(await bobSigner.getAddress())).eq(true);
        });
    });

    describe("NFTAuction contract functionalities tests", async () => {
        it("...should not allow non seller to start the auction", async () => {
            await expect(auctionContract.connect(aliceSigner).start(60)).to.revertedWith("not seller");
        });

        it("...should not allow bidder to bid before the auction has started", async () => {
            await expect(
                auctionContract.connect(aliceSigner).bid({ value: ethers.utils.parseEther("0.0001") })
            ).to.revertedWith("not started");
        });

        it("...should not allow seller to end the auction before it starts", async () => {
            await expect(auctionContract.connect(ownerSigner).end()).to.revertedWith("not started");
        });

        it("...should allow seller to start the auction", async () => {
            const response = await auctionContract.connect(ownerSigner).start(60);
            await response.wait(2);
            expect(await nftContract.ownerOf(1)).eq(auctionContract.address);
            expect(await auctionContract.getStarted()).eq(true);
        });

        it("...should not allow seller to start the same auction if it has already started", async () => {
            await expect(auctionContract.connect(ownerSigner).start(60)).to.revertedWith("started");
        });

        it("...should not allow seller to end the auction before the auction expiry duration", async () => {
            await expect(auctionContract.connect(ownerSigner).end()).to.revertedWith("not ended");
        });

        it("...should allow alice bidder to bid", async () => {
            const response = await auctionContract
                .connect(aliceSigner)
                .bid({ value: ethers.utils.parseEther("0.0002") });
            await response.wait(2);
            expect(await auctionContract.getHighestBidder()).eq(await aliceSigner.getAddress());
            expect(await auctionContract.getHighestBid()).eq(ethers.utils.parseEther("0.0002"));
        });

        it("...should not allow bob bidder to bid with value lower than current highest bid value", async () => {
            await expect(
                auctionContract.connect(bobSigner).bid({ value: ethers.utils.parseEther("0.0001") })
            ).to.revertedWith("value < highest");
        });

        it("...should allow bob bidder to bid with value greater than current highest bid value", async () => {
            const response = await auctionContract
                .connect(bobSigner)
                .bid({ value: ethers.utils.parseEther("0.0003") });
            await response.wait(2);
            expect(await auctionContract.getHighestBidder()).eq(await bobSigner.getAddress());
            expect(await auctionContract.getHighestBid()).eq(ethers.utils.parseEther("0.0003"));
        });

        it("...should allow seller to end an auction after the auction expiry time has passed", async () => {
            await sleep(60000);
            const response = await auctionContract.connect(ownerSigner).end();
            await response.wait(2);
            expect(await nftContract.ownerOf(1)).eq(await bobSigner.getAddress());
        });

        it("...should not allow seller to end an already ended auction", async () => {
            await expect(auctionContract.connect(ownerSigner).end()).to.revertedWith("ended");
        });

        it("...should not allow any bidder to bid once an auction has ended", async () => {
            await expect(
                auctionContract.connect(aliceSigner).bid({ value: ethers.utils.parseEther("0.005") })
            ).to.revertedWith("ended");
        });
    });
});
