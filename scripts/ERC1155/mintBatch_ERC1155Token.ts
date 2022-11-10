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
        // Empty array to store user input arguments
        let arrayOfAmounts: any = [];
        console.log("\n");

        const provider = new providers.JsonRpcProvider(zkEVM_RPC);
        const signer = new Wallet(pKey, provider);
        const erc1155_ABI = abi;
        const erc1155_contract = new ethers.Contract(erc1155Token_address, erc1155_ABI, provider);
        const erc1155_connect = erc1155_contract.connect(signer);

        const recipient = prompt("Enter the recipient address: ");
        if (!recipient) return console.log("recipient address cannot be null");
        if (recipient.length !== 42) return console.log(`${recipient} is not a valid address`);

        const totalTokensToMint = prompt("Enter the total number of token to mint in batch: ");
        if (!totalTokensToMint) return console.log("Total number of token to mint in batch cannot be null");
        if (totalTokensToMint !== 0) {
            for (let i = 0; i < totalTokensToMint; i++) {
                arrayOfAmounts[i] = prompt(
                    `Enter the amounts of ERC1155 Token to Mint [${i + 1}]/[${totalTokensToMint}]: `
                );
                if (!arrayOfAmounts[i]) return console.log("amount of ERC1155 Token to Mint cannot be null");
            }
        }

        const erc1155TokenMintBatchTx = await erc1155_connect.mintBatchTestERC1155(recipient, arrayOfAmounts);
        console.log("\nMint ERC1155 Token as requested...");

        await erc1155TokenMintBatchTx.wait();

        const erc1155TokenMintBatchTxHash = erc1155TokenMintBatchTx.hash;

        console.log("\nTransaction Hash: ", erc1155TokenMintBatchTxHash);
        console.log(
            `Transaction Details: https://explorer.public.zkevm-test.net/tx/${erc1155TokenMintBatchTxHash}`
        );
        console.log(`\nERC1155 Tokens minted successfully\n`);
    } catch (error) {
        console.log("Error in mint: ", error);
        process.exit(1);
    }
}

mint();
