import { expect } from "chai";
import { sleep } from "./utils/wait";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import token_artifacts from "../artifacts/src/staking_contracts/token.sol/MyToken.json";
import stake_artifacts from "../artifacts/src/staking_contracts/stake.sol/StakeToken.json";

describe("Staking contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let tokenContract: any;
    let stakeContract: any;
    let timestamp: any;

    // setup atleast 5 wallet addresses for testing

    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\n-----------------------------------------------------------------------------------");
        console.log("Deploying Staking smart contract on zkEVM chain....");
        console.log("-----------------------------------------------------------------------------------\n");

        // check & display current balances
        await checkBalances(derivedNode);

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

        // deploy the contract
        const token_contract = await token_Factory.deploy();
        await token_contract.deployed();

        const stake_contract = await stake_Factory.deploy(token_contract.address);
        await stake_contract.deployed();

        // get the instance of the deployed contract
        tokenContract = new Contract(token_contract.address, token_artifacts.abi, zkEVM_provider);
        stakeContract = new Contract(stake_contract.address, stake_artifacts.abi, zkEVM_provider);

        console.log("\nERC20 token Contract Deployed at: ", tokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${tokenContract.address}`
        );
        console.log("\n");
        console.log("Staking Contract Deployed at: ", stakeContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${stakeContract.address}`
        );
    });

    describe("Setting up staking smart contract", async () => {
        it("...should transfer reward tokens to staking smart contract", async () => {
            const tx = await tokenContract
                .connect(ownerSigner)
                .transfer(stakeContract.address, ethers.utils.parseEther("100"));
            await tx.wait(2);
        });

        it("...should approve token for staking smart contract", async () => {
            const approve = await tokenContract
                .connect(ownerSigner)
                .approve(stakeContract.address, ethers.utils.parseEther("10000"));
            await approve.wait(2);
        });
    });

    describe("Staking contract functionalities tests", async () => {
        it("...can stake ", async () => {
            const stake = await stakeContract.connect(ownerSigner).stakeToken(ethers.utils.parseEther("100"));
            await stake.wait(2);
            const blockNumber = await zkEVM_provider.getBlockNumber();
            timestamp = (await zkEVM_provider.getBlock(blockNumber)).timestamp;
            expect(await stakeContract.addressStaked(await ownerSigner.getAddress())).eq(true);
        });

        it("...can pause staking", async () => {
            const tx = await stakeContract.connect(ownerSigner).pause();
            await tx.wait(2);
            expect(await stakeContract.paused()).eq(true);
        });

        it("...can unpause staking", async () => {
            const tx = await stakeContract.connect(ownerSigner).unpause();
            await tx.wait(2);
            expect(await stakeContract.paused()).eq(false);
        });

        it("...can claim reward", async () => {
            await sleep(60000);
            const tx = await stakeContract.connect(ownerSigner).claimReward();
            await tx.wait(2);
            expect(await stakeContract.isClaimReward(await ownerSigner.getAddress())).eq(true);
        });
    });
});
