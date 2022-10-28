import { providers, Wallet } from "ethers";
import ps from "prompt-sync";
const prompt = ps();
import { config } from "dotenv";
import { ethers } from "hardhat";
import { abi } from "../../artifacts/src/ERC721Token.sol/TestTokenERC721.json";
config();

const pKey: any = process.env.PRIVATE_KEY;
const erc721Token_address: any = process.env.ERC721_TOKEN;
const zkEVM_RPC: any = process.env.RPC_URL;

async function mint() {
    try {
        // Empty array to store user input arguments
        let arrayOfHashes: any = [];
        console.log("\n");

        const provider = new providers.JsonRpcProvider(zkEVM_RPC);
        const signer = new Wallet(pKey, provider);
        const erc721_ABI = abi;
        const erc721_contract = new ethers.Contract(erc721Token_address, erc721_ABI, provider);
        const erc721_connect = erc721_contract.connect(signer);

        const recipient = prompt("Enter the recipient address: ");
        if (!recipient) return console.log("recipient address cannot be null");
        if (recipient.length !== 42) return console.log(`${recipient} is not a valid address`);

        const totalTokensToMint = prompt("Enter the total number of token to mint in batch: ");
        if (!totalTokensToMint) return console.log("Total number of token to mint in batch cannot be null");
        if (totalTokensToMint !== 0) {
            for (let i = 0; i < totalTokensToMint; i++) {
                arrayOfHashes[i] = prompt(
                    `Enter the hash for ERC721 Token to Mint [${i + 1}]/[${totalTokensToMint}]: `
                );
                if (!arrayOfHashes[i]) return console.log("amount of ERC721 Token to Mint cannot be null");
            }
        }

        const erc721TokenMintBatchTx = await erc721_connect.issueBatch(recipient, arrayOfHashes);
        console.log("\nMint ERC721 Token as requested...");

        await erc721TokenMintBatchTx.wait();

        const erc721TokenMintBatchTxHash = erc721TokenMintBatchTx.hash;

        console.log("\nTransaction Hash: ", erc721TokenMintBatchTxHash);
        console.log(
            `Transaction Details: https://explorer.public.zkevm-test.net/tx/${erc721TokenMintBatchTxHash}`
        );
        console.log(`\nERC721 Tokens minted successfully\n`);
    } catch (error) {
        console.log("Error in mint: ", error);
        process.exit(1);
    }
}

mint();
