import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import upgrades from "hardhat";
import { setupWallet, zkEVM_provider, ownerSigner, userSigner, aliceSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import token_artifacts from "../artifacts/src/token.sol/MyToken.json";
import stake_artifacts from "../artifacts/src/stake.sol/StakeToken.json";

describe("Staking contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let tokenContract: any;
    let stakeContract: any;
    let timestamp: any;

    // setup atleast 5 wallet addresses for testing

    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR STAKING CONTRACT\n");

        // get the contract factory
        const token_Factory = new ethers.ContractFactory(
            token_artifacts.abi,
            token_artifacts.bytecode,
            ownerSigner
        );
        const stake_Factory = new ethers.ContractFactory(
            stake_artifacts.abi,
            stake_artifacts.bytecode,
            ownerSigner
        );

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying staking contract on zkEVM chain....");

        // deploy the contract
        const token_contract = await token_Factory.deploy();
        await token_contract.deployed();

        const stake_contract = await stake_Factory.deploy(token_contract.address);
        await stake_contract.deployed();

        // get the instance of the deployed contract
        tokenContract = new Contract(token_contract.address, token_artifacts.abi, zkEVM_provider);
        stakeContract = new Contract(stake_contract.address, stake_artifacts.abi, zkEVM_provider);

        console.log("\nerc20 token contract deployed at: ", tokenContract.address);
        console.log("staking contract deployed at: ", stakeContract.address);

        //transfer reward token to contract
        console.log("transferring reward token to staking contract...");
        const tx = await tokenContract
            .connect(ownerSigner)
            .transfer(stakeContract.address, ethers.utils.parseEther("100"));
        await tx.wait();

        //approval to stake token
        console.log("token approving...\n");
        const approve = await tokenContract
            .connect(ownerSigner)
            .approve(stakeContract.address, ethers.utils.parseEther("10000"));
        await approve.wait();
    });

    describe("staking contract functionalities tests", async () => {
        it("can stake ", async () => {
            const stake = await stakeContract.connect(ownerSigner).stakeToken(ethers.utils.parseEther("100"));
            await stake.wait();
            const blockNumber = await zkEVM_provider.getBlockNumber();
            timestamp = (await zkEVM_provider.getBlock(blockNumber)).timestamp;
            expect(await stakeContract.addressStaked(await ownerSigner.getAddress())).eq(true);
        });

        it("can get token expiry ", async () => {
            const stake = await stakeContract.connect(ownerSigner).getTokenExpiry();
            const duration = await stakeContract.planDuration();
            expect(stake.toNumber()).eq(Number(timestamp) + Number(duration));
        });

        it("can pause staking", async () => {
            const tx = await stakeContract.connect(ownerSigner).pause();
            await tx.wait();
            expect(await stakeContract.paused()).eq(true);
        });

        it("can unpause staking", async () => {
            const tx = await stakeContract.connect(ownerSigner).unpause();
            await tx.wait();
            expect(await stakeContract.paused()).eq(false);
        });

        it("can claim reward", async () => {
            const tx = await stakeContract.connect(ownerSigner).claimReward();
            await tx.wait();
            expect(await stakeContract.isClaimReward(await ownerSigner.getAddress())).eq(true);
        });
    });
});
