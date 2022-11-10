import { providers, Wallet } from "ethers";
import ps from "prompt-sync";
const prompt = ps();
import { config } from "dotenv";
import { ethers } from "hardhat";
import { abi } from "../../artifacts/src/ERC20Token.sol/TestTokenERC20.json";
config();

const pKey: any = process.env.PRIVATE_KEY;
const erc20Token_address: any = process.env.ERC20_TOKEN;
const zkEVM_RPC: any = process.env.RPC_URL;

async function mint() {
    try {
        console.log("\n");

        const provider = new providers.JsonRpcProvider(zkEVM_RPC);
        const signer = new Wallet(pKey, provider);
        const erc20_ABI = abi;
        const erc20_contract = new ethers.Contract(erc20Token_address, erc20_ABI, provider);
        const erc20_connect = erc20_contract.connect(signer);

        const recipient = prompt("Enter the recipient address: ");
        if (!recipient) return console.log("recipient address cannot be null");
        if (recipient.length !== 42) return console.log(`${recipient} is not a valid address`);

        const amount = prompt("Enter the amount of ERC20 Token to Mint: ");
        if (!amount) return console.log("amount of ERC20 Token to Mint cannot be null");

        const erc20TokenMintTx = await erc20_connect.mintERC20(recipient, amount);
        console.log("\nMint ERC20 Token as requested...");

        await erc20TokenMintTx.wait();

        const erc20TokenMintTxHash = erc20TokenMintTx.hash;

        console.log("\nTransaction Hash: ", erc20TokenMintTxHash);
        console.log(`Transaction Details: https://explorer.public.zkevm-test.net/tx/${erc20TokenMintTxHash}`);
        console.log(`\nERC20 Token minted successfully\n`);
    } catch (error) {
        console.log("Error in mint: ", error);
        process.exit(1);
    }
}

mint();
