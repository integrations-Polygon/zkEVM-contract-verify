import { providers, Wallet } from "ethers";
import ps from "prompt-sync";
const prompt = ps();
import { config } from "dotenv";
import { ethers } from "hardhat";
import { abi } from "../../artifacts/src/ERC1155Token.sol/TestTokenERC1155.json";
config();

const pKey: any = process.env.PRIVATE_KEY;
const erc1155Token_address: any = process.env.ERC1155_TOKEN;
const zkEVM_RPC: any = process.env.RPC_URL;

async function mint() {
    try {
        console.log("\n");

        const provider = new providers.JsonRpcProvider(zkEVM_RPC);
        const signer = new Wallet(pKey, provider);
        const erc1155_ABI = abi;
        const erc1155_contract = new ethers.Contract(erc1155Token_address, erc1155_ABI, provider);
        const erc1155_connect = erc1155_contract.connect(signer);

        const recipient = prompt("Enter the recipient address: ");
        if (!recipient) return console.log("recipient address cannot be null");
        if (recipient.length !== 42) return console.log(`${recipient} is not a valid address`);

        const amount = prompt("Enter the amount of ERC1155 Token to Mint: ");
        if (!amount) return console.log("amount of ERC1155 Token to Mint cannot be null");

        const erc1155TokenMintTx = await erc1155_connect.mintTestERC1155(recipient, amount);
        console.log("\nMint ERC1155 Token as requested...");

        await erc1155TokenMintTx.wait();

        const erc1155TokenMintTxHash = erc1155TokenMintTx.hash;

        console.log("\nTransaction Hash: ", erc1155TokenMintTxHash);
        console.log(
            `Transaction Details: https://explorer.public.zkevm-test.net/tx/${erc1155TokenMintTxHash}`
        );
        console.log(`\nERC1155 Token minted successfully\n`);
    } catch (error) {
        console.log("Error in mint: ", error);
        process.exit(1);
    }
}

mint();
