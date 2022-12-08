import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import nftAsset_artifacts from "../artifacts/src/clone_contracts/NFTAsset.sol/NFTAsset.json";
import assetFactory_artifacts from "../artifacts/src/clone_contracts/AssetFactoryCreate.sol/AssetFactoryCreate.json";
import assetFactoryCreate2_artifacts from "../artifacts/src/clone_contracts/AssetFactoryCreate2.sol/AssetFactoryCreate2.json";

describe("Clone contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let nftAssetContract: any;
    let assetFactoryContract: any;
    let assetFactoryContractCreate2: any;
    let cloneInstanceCreate: any;
    let cloneInstanceCreate2: any;

    // setup atleast 5 wallet addresses for testing

    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR CLONE CONTRACT\n");

        // get the contract factory
        const nftAsset_Factory = new ethers.ContractFactory(
            nftAsset_artifacts.abi,
            nftAsset_artifacts.bytecode,
            ownerSigner
        );
        const assetFactory_Factory = new ethers.ContractFactory(
            assetFactory_artifacts.abi,
            assetFactory_artifacts.bytecode,
            ownerSigner
        );
        const assetFactoryCreate2_Factory = new ethers.ContractFactory(
            assetFactoryCreate2_artifacts.abi,
            assetFactoryCreate2_artifacts.bytecode,
            ownerSigner
        );

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying clone contract on zkEVM chain....");

        // deploy the contract
        const nftAsset_contract = await nftAsset_Factory.deploy();
        const assetFactory_contract = await assetFactory_Factory.deploy();
        const assetFactoryCreate2_contract = await assetFactoryCreate2_Factory.deploy();

        // wait for the contract to get deployed
        await nftAsset_contract.deployed();
        await assetFactory_contract.deployed();
        await assetFactory_contract.deployed();

        // get the instance of the deployed contract
        nftAssetContract = new Contract(nftAsset_contract.address, nftAsset_artifacts.abi, zkEVM_provider);
        assetFactoryContract = new Contract(
            assetFactory_contract.address,
            assetFactory_artifacts.abi,
            zkEVM_provider
        );
        assetFactoryContractCreate2 = new Contract(
            assetFactoryCreate2_contract.address,
            assetFactoryCreate2_artifacts.abi,
            zkEVM_provider
        );

        console.log("\nNFT asset contract deployed at: ", nftAssetContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${nftAssetContract.address}`
        );
        console.log("Clone create asset factory contract deployed at: ", assetFactoryContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${assetFactoryContract.address}`
        );
        console.log(
            "Clone create2 asset factory contract deployed at: ",
            assetFactoryContractCreate2.address
        );
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${assetFactoryContractCreate2.address}`
        );
        console.log("\n");
    });

    describe("Clone create contract functionalities tests", async () => {
        const orgId = "1";
        const collectionId = "NFT Clone";
        const nftName = "Test Clone";
        const nftSymbol = "TC";

        it("...can set nft contract", async () => {
            const setService = await assetFactoryContract
                .connect(ownerSigner)
                .setNFTContract(nftAssetContract.address);
            await setService.wait();
            expect(await assetFactoryContract.nftContract()).eq(nftAssetContract.address);
        });

        it("...can set service address", async () => {
            const address = "0xC980bBe81d7AE0CcbF72B6AbD59534dd8d176c77";
            const setService = await assetFactoryContract.connect(ownerSigner).setService(address);
            await setService.wait(1);
            expect(await assetFactoryContract.service()).eq(address);
        });

        it("...can clone nft contract", async () => {
            const cloneContract = await assetFactoryContract
                .connect(ownerSigner)
                .cloneNFTContract(orgId, collectionId, nftName, nftSymbol);
            await cloneContract.wait();
            cloneInstanceCreate = await assetFactoryContract.cloneInstance();
            const instanceContract = new ethers.Contract(
                cloneInstanceCreate,
                nftAsset_artifacts.abi,
                zkEVM_provider
            );
            expect(await instanceContract.name()).eq("Test Clone");
        });

        it("...can read to clone contract", async () => {
            const instanceContract = new ethers.Contract(
                cloneInstanceCreate,
                nftAsset_artifacts.abi,
                zkEVM_provider
            );
            expect(await instanceContract.symbol()).eq("TC");
        });

        it("...can write to clone contract", async () => {
            const baseURI = "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/";
            const instanceContract = new ethers.Contract(
                cloneInstanceCreate,
                nftAsset_artifacts.abi,
                zkEVM_provider
            );
            const setBaseURI = await instanceContract.connect(ownerSigner).setBaseURI(baseURI);
            await setBaseURI.wait();
            expect(await instanceContract.baseURI()).eq(baseURI);
        });
    });

    describe("Clone create2 contract functionalities tests", async () => {
        const orgId = "1";
        const collectionId = "NFT Clone";
        const nftName = "Test Clone";
        const nftSymbol = "TC";

        it("...can set nft contract", async () => {
            const setService = await assetFactoryContractCreate2
                .connect(ownerSigner)
                .setNFTContract(nftAssetContract.address);
            await setService.wait(1);
            expect(await assetFactoryContractCreate2.nftContract()).eq(nftAssetContract.address);
        });

        it("...can set service address", async () => {
            const address = "0xC980bBe81d7AE0CcbF72B6AbD59534dd8d176c77";
            const setService = await assetFactoryContractCreate2.connect(ownerSigner).setService(address);
            await setService.wait(1);
            expect(await assetFactoryContractCreate2.service()).eq(address);
        });

        it("...can clone nft contract", async () => {
            const cloneContract = await assetFactoryContractCreate2
                .connect(ownerSigner)
                .cloneNFTContract(orgId, collectionId, nftName, nftSymbol);
            await cloneContract.wait();
            cloneInstanceCreate2 = await assetFactoryContractCreate2.cloneInstance();
            const instanceContract = new ethers.Contract(
                cloneInstanceCreate2,
                nftAsset_artifacts.abi,
                zkEVM_provider
            );
            expect(await instanceContract.name()).eq("Test Clone");
        });

        it("...can read to clone contract", async () => {
            const instanceContract = new ethers.Contract(
                cloneInstanceCreate2,
                nftAsset_artifacts.abi,
                zkEVM_provider
            );
            expect(await instanceContract.symbol()).eq("TC");
        });

        it("...can write to clone contract", async () => {
            const baseURI = "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/";
            const instanceContract = new ethers.Contract(
                cloneInstanceCreate2,
                nftAsset_artifacts.abi,
                zkEVM_provider
            );
            const setBaseURI = await instanceContract.connect(ownerSigner).setBaseURI(baseURI);
            await setBaseURI.wait();
            expect(await instanceContract.baseURI()).eq(baseURI);
        });
    });
});
