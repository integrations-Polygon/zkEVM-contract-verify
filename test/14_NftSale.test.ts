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
import sigUtil from "@metamask/eth-sig-util";
import { checkBalances } from "./utils/checkBalances";
import ERC20Token_artifacts from "../artifacts/src/marketplace_contracts/ERC20Token.sol/ERC20Token.json";
import ERC721Token_artifacts from "../artifacts/src/marketplace_contracts/ERC721Token.sol/ERC721Token.json";
import NFTSale_artifacts from "../artifacts/src/marketplace_contracts/NFTSale.sol/NFTSale.json";

describe("NFTSale contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let nftContract: any;
    let saleContract: any;
    let tokenContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR STAKING CONTRACT\n");

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

        const sale_Factory = new ethers.ContractFactory(
            NFTSale_artifacts.abi,
            NFTSale_artifacts.bytecode,
            ownerSigner
        );

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying staking contract on zkEVM chain....");

        /* 
            DEPLOY THE CONTRACTS 
        */

        const token_contract = await token_Factory.deploy();
        await token_contract.deployed();

        const nft_contract = await nft_Factory.deploy();
        await nft_contract.deployed();

        const sale_contract = await sale_Factory.deploy(
            token_contract.address,
            nft_contract.address,
            adminSigner.getAddress()
        );
        await sale_contract.deployed();

        /* 
            GET THE INSTANCE OF THE DEPLOYED CONTRACT 
        */

        tokenContract = new Contract(token_contract.address, ERC20Token_artifacts.abi, zkEVM_provider);
        nftContract = new Contract(nft_contract.address, ERC721Token_artifacts.abi, zkEVM_provider);
        saleContract = new Contract(sale_contract.address, NFTSale_artifacts.abi, zkEVM_provider);

        console.log("\nERC20 token contract deployed at: ", tokenContract.address);
        console.log("ERC721 token contract deployed at: ", nftContract.address);
        console.log("NFTSale contract deployed at: ", saleContract.address);
        console.log("\nSetting up the ideal scenario for NFTSale....\n\n");

        /* 
            TRANSFER ERC20 TOKEN TO THE USERS
        */

        const transferToken_alice = await tokenContract
            .connect(ownerSigner)
            .transfer(aliceSigner.getAddress(), "10000");
        await transferToken_alice.wait(1);
        expect(await tokenContract.balanceOf(aliceSigner.getAddress())).eq("10000");

        const transferToken_bob = await tokenContract
            .connect(ownerSigner)
            .transfer(bobSigner.getAddress(), "10000");
        await transferToken_bob.wait(1);
        expect(await tokenContract.balanceOf(bobSigner.getAddress())).eq("10000");

        const transferToken_saleContract = await tokenContract
            .connect(ownerSigner)
            .transfer(saleContract.address, "10000");
        await transferToken_saleContract.wait(1);
        expect(await tokenContract.balanceOf(saleContract.address)).eq("10000");

        /* 
            WHITELIST ADDRESSES FOR ERC721 TOKEN
        */

        const whitelist_owner = await nftContract
            .connect(ownerSigner)
            .addToWhitelist(ownerSigner.getAddress());
        await whitelist_owner.wait(1);
        expect(await nftContract.checkWhitelist(ownerSigner.getAddress())).eq(true);

        const whitelist_alice = await nftContract
            .connect(ownerSigner)
            .addToWhitelist(aliceSigner.getAddress());
        await whitelist_alice.wait(1);
        expect(await nftContract.checkWhitelist(aliceSigner.getAddress())).eq(true);

        const whitelist_bob = await nftContract.connect(ownerSigner).addToWhitelist(bobSigner.getAddress());
        await whitelist_bob.wait(1);
        expect(await nftContract.checkWhitelist(bobSigner.getAddress())).eq(true);

        const whitelist_saleContract = await nftContract
            .connect(ownerSigner)
            .addToWhitelist(saleContract.address);
        await whitelist_saleContract.wait(1);
        expect(await nftContract.checkWhitelist(saleContract.address)).eq(true);

        /* 
            MINT ERC721 TOKEN TO RESPECTIVE USERS 
        */

        const issueToken_owner = await nftContract
            .connect(ownerSigner)
            .issueToken(ownerSigner.getAddress(), `owner-hash-01`);
        await issueToken_owner.wait(1);
        expect(await nftContract.ownerOf(1)).eq(ownerSigner.getAddress());

        const issueToken_alice = await nftContract
            .connect(ownerSigner)
            .issueToken(aliceSigner.getAddress(), `alice-hash-02`);
        await issueToken_alice.wait(1);
        expect(await nftContract.ownerOf(2)).eq(aliceSigner.getAddress());

        const issueToken_bob = await nftContract
            .connect(ownerSigner)
            .issueToken(bobSigner.getAddress(), `bob-hash-03`);
        await issueToken_bob.wait(1);
        expect(await nftContract.ownerOf(3)).eq(bobSigner.getAddress());
    });

    describe("NFTSale contract functionalities tests", async () => {
        it("...should have correct NFT address", async () => {
            expect(await saleContract.nftAddress()).eq(nftContract.address);
        });

        it("...should allow owner to set admin", async () => {
            const setAdminResponse = await saleContract
                .connect(ownerSigner.getAddress())
                .setAdmin(adminSigner.getAddress(), true);
            await setAdminResponse.wait(1);
            expect(await saleContract.isAdmin(adminSigner.getAddress())).eq(true);
        });

        it("...should not allow non-owner to set admin", async () => {
            await expect(
                saleContract.connect(userSigner).setAdmin(userSigner.getAddress(), true)
            ).to.revertedWith("Ownable: caller is not the owner");
        });

        it("...should not allow owner to start the sale without granting approval", async () => {
            await expect(saleContract.connect(ownerSigner).sellNFTBundle([1], 1000)).to.revertedWith(
                "ERC721: transfer caller is not owner nor approved"
            );
        });

        it("...should allow owner to start the sale", async () => {
            const approvalResponse = await nftContract.connect(ownerSigner).approve(saleContract.address, 1);
            await approvalResponse.wait(1);

            const saleResponse = await saleContract.connect(ownerSigner).sellNFTBundle([1], 1000);
            await saleResponse.wait(1);
            expect(await nftContract.ownerOf(1)).eq(saleContract.address);
        });

        it("...should be able to get sale using Listing ID", async () => {
            const listingResponse = await saleContract.getListing(1);
            expect(listingResponse[0]).eq(1);
        });

        it("...alice should be able to purchase", async () => {
            const approvalResponse = await tokenContract
                .connect(aliceSigner)
                .approve(saleContract.address, 1000);
            await approvalResponse.wait(1);

            const purchaseResponse = await saleContract.connect(aliceSigner).purchaseNFT(1, 1000);
            await purchaseResponse.wait(1);
            expect(await tokenContract.ownerOf(1)).eq(aliceSigner);
        });

        it("...should allow seller to cancel an ongoing sale", async () => {
            const approvalResponse = await nftContract.connect(bobSigner).approve(saleContract.address, 3);
            await approvalResponse.wait(1);

            const saleResponse = await saleContract.connect(bobSigner).sellNFTBundle([3], 1000);
            await saleResponse.wait(1);
            expect(await nftContract.ownerOf(3)).eq(saleContract.address);

            const cancelSaleResponse = await saleContract.connect(bobSigner).cancelListingBundle(1);
            await cancelSaleResponse.wait(1);
            expect(await nftContract.ownerOf(3)).eq(bobSigner.getAddress());
        });

        it("...can sign messages and verify", async () => {
            const START_TIME: number = Math.round(Date.now() / 1000);
            const approvalResponse_nftContract = await nftContract
                .connect(bobSigner)
                .approve(saleContract.address, 3);
            await approvalResponse_nftContract.wait(1);

            const saleResponse = await saleContract.connect(bobSigner).sellNFTBundle([3], 1000);
            await saleResponse.wait(1);
            expect(await nftContract.ownerOf(3)).eq(saleContract.address);

            const approvalResponse_tokenContract = await tokenContract
                .connect(aliceSigner)
                .approve(saleContract.address, 1000);
            await approvalResponse_tokenContract.wait(1);

            let domainData: any = {
                name: "NFTSale",
                version: "1",
                verifyingContract: saleContract.address,
                salt:
                    "0x" +
                    parseInt((await saleContract.getChainId()).toString())
                        .toString(16)
                        .padStart(64, "0"),
            };

            const domainType: any = [
                {
                    name: "name",
                    type: "string",
                },
                {
                    name: "version",
                    type: "string",
                },
                {
                    name: "verifyingContract",
                    type: "address",
                },
                {
                    name: "salt",
                    type: "bytes32",
                },
            ];

            const offerType: any = [
                {
                    name: "buyer",
                    type: "address",
                },
                {
                    name: "price",
                    type: "uint256",
                },
                {
                    name: "listingId",
                    type: "uint256",
                },
                {
                    name: "timestamp",
                    type: "uint256",
                },
                {
                    name: "expiryTime",
                    type: "uint256",
                },
            ];

            let message: any = {
                buyer: aliceSigner.getAddress(),
                price: 400,
                listingId: 1,
                timestamp: START_TIME,
                expiryTime: START_TIME + 100000000,
            };

            const dataToSign: any = {
                types: {
                    EIP712Domain: domainType,
                    Offer: offerType,
                },
                domain: domainData,
                primaryType: "Offer",
                message: message,
            };

            const signature = sigUtil.signTypedData({
                privateKey: Buffer.from(
                    derivedNode[3].privateKey, // Private key of alice
                    "hex"
                ),
                data: dataToSign,
                version: sigUtil.SignTypedDataVersion.V3,
            });

            let r = signature.slice(0, 66);
            let s = "0x".concat(signature.slice(66, 130));
            let V = "0x".concat(signature.slice(130, 132));
            let v = parseInt(V);

            if (![27, 28].includes(v)) v += 27;

            const offerAcceptResponse = await saleContract
                .connect(bobSigner)
                .acceptOffer(aliceSigner.getAddress(), 400, 1, START_TIME, START_TIME + 100000000, r, s, v);
            await offerAcceptResponse.wait(1);
            expect(await nftContract.ownerOf(3)).eq(aliceSigner.getAddress());
        });
    });
});
