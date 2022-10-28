import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallets } from "./utils/setupWallet";
import { providers, ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import { abi, bytecode } from "../artifacts/src/ERC20Token.sol/TestTokenERC20.json";

const zkEVM_RPC: any = process.env.ZKEVM_RPC_URL;

describe("ERC20 Token tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let erc20TokenContract: any;

    // get zkEVM provider
    const zkEVM_provider = new providers.JsonRpcProvider(zkEVM_RPC);

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallets();

    // deployer or owner signer
    const ownerSigner = new ethers.Wallet(derivedNode[0].privateKey, zkEVM_provider);

    before(async () => {
        console.log("AUTOMATE UNIT TEST CASES FOR STANDARD ERC20 TOKEN\n\n");

        // get the contract factory
        const erc20TokenFactory = new ethers.ContractFactory(abi, bytecode, ownerSigner);

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying ERC20 Token smart contract on zkEVM chain....");

        // deploy the contract
        const erc20Token = await erc20TokenFactory.deploy();

        // wait for the contract to get deployed
        await erc20Token.deployed();

        // get the instance of the deployed contract
        erc20TokenContract = new Contract(erc20Token.address, abi, zkEVM_provider);

        console.log("\nERC20 Token contract deployed at: ", erc20TokenContract.address);
        console.log(
            `Contract Details: https://explorer.public.zkevm-test.net/address/${erc20TokenContract.address}`
        );
    });

    it("has correct token name", async () => {
        expect(await erc20TokenContract.name()).eq("ERC20 Test Token");
    });

    it("has correct token symbol", async () => {
        expect(await erc20TokenContract.symbol()).eq("TT20");
    });

    it("mints on deployment", async () => {
        expect(await erc20TokenContract.balanceOf(derivedNode[0].address)).eq(
            ethers.utils.parseEther("1000000000")
        );
    });

    it("can mint tokens", async () => {
        const ownerSigner = new ethers.Wallet(derivedNode[0].privateKey, zkEVM_provider);

        const mintTx = await erc20TokenContract
            .connect(ownerSigner)
            .mintERC20(derivedNode[1].address, ethers.utils.parseEther("10"));
        await mintTx.wait(1);
        expect(await erc20TokenContract.balanceOf(derivedNode[1].address)).eq(ethers.utils.parseEther("10"));
    });

    it("transfers to other address", async () => {
        const ownerSigner = new ethers.Wallet(derivedNode[0].privateKey, zkEVM_provider);

        const transferTx = await erc20TokenContract
            .connect(ownerSigner)
            .transfer(derivedNode[2].address, ethers.utils.parseEther("1"));
        await transferTx.wait(1);
        expect(await erc20TokenContract.balanceOf(derivedNode[2].address)).eq(ethers.utils.parseEther("1"));
    });

    it("doesn't allow to transfer if insufficient balance", async () => {
        const aliceSigner = new ethers.Wallet(derivedNode[2].privateKey, zkEVM_provider);
        await expect(
            erc20TokenContract
                .connect(aliceSigner)
                .transfer(derivedNode[3].address, ethers.utils.parseEther("1000"))
        ).to.be.reverted;
    });

    it("doesn't allow transferring to 0 address", async () => {
        await expect(erc20TokenContract.transfer(ethers.constants.AddressZero, 100)).to.be.reverted;
    });

    it("sets correct allowance", async () => {
        const ownerSigner = new ethers.Wallet(derivedNode[0].privateKey, zkEVM_provider);

        const approveTx = await erc20TokenContract
            .connect(ownerSigner)
            .approve(derivedNode[1].address, ethers.utils.parseEther("2"));
        await approveTx.wait(1);

        expect(await erc20TokenContract.allowance(derivedNode[0].address, derivedNode[1].address)).eq(
            ethers.utils.parseEther("2")
        );
    });

    it("allows to transferFrom", async () => {
        const aliceSigner = new ethers.Wallet(derivedNode[1].privateKey, zkEVM_provider);

        const transferTx = await erc20TokenContract
            .connect(aliceSigner)
            .transferFrom(derivedNode[0].address, derivedNode[1].address, 1000);
        await transferTx.wait(1);

        expect(await erc20TokenContract.balanceOf(derivedNode[2].address)).eq(ethers.utils.parseEther("1"));
    });

    it("doesn't allow to transferFrom if insufficient allowance", async () => {
        const ownerSigner = new ethers.Wallet(derivedNode[0].privateKey, zkEVM_provider);
        const bobSigner = new ethers.Wallet(derivedNode[2].privateKey, zkEVM_provider);

        const tx = await erc20TokenContract
            .connect(ownerSigner)
            .approve(derivedNode[2].address, ethers.utils.parseEther("1"));
        await tx.wait(1);
        await expect(
            erc20TokenContract
                .connect(bobSigner)
                .transferFrom(
                    derivedNode[0].address,
                    derivedNode[3].address,
                    ethers.utils.parseEther("10000")
                )
        ).to.be.reverted;
    });
});
