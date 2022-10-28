import { providers, Wallet } from "ethers";
import { config } from "dotenv";
import ps from "prompt-sync";
const prompt = ps();
import { abi } from "../../artifacts/src/ERC721Token.sol/TestTokenERC721.json";
import { ethers } from "hardhat";
config();

const pKey: any = process.env.PRIVATE_KEY;
const erc721Token_address: any = process.env.ERC721_TOKEN;
const zkEVM_RPC: any = process.env.RPC_URL;

async function setAdmin() {
    try {
        console.log("\n");
        const adminAddress = prompt("Enter the wallet address: ");
        if (!adminAddress) return console.log("wallet address cannot be null");
        if (adminAddress.length !== 42) return console.log(`${adminAddress} is not a valid address`);

        const adminStatus = prompt("Enter the admin status (true | false): ");
        if (!adminStatus) return console.log("admin status cannot be null");
        if (
            adminStatus !== "true" &&
            adminStatus !== "TRUE" &&
            adminStatus !== "false" &&
            adminStatus !== "FALSE"
        )
            return console.log(`${adminStatus} is not a valid input`);

        const provider = new providers.JsonRpcProvider(zkEVM_RPC);
        const signer = new Wallet(pKey, provider);
        const erc721_ABI = abi;
        const erc721_contract = new ethers.Contract(erc721Token_address, erc721_ABI, provider);
        const erc721_connect = erc721_contract.connect(signer);

        const setAdminOnERC721Tx = await erc721_connect.setAdmin(adminAddress, adminStatus);
        await setAdminOnERC721Tx.wait();

        const setAdminOnERC721TxHash = setAdminOnERC721Tx.hash;

        console.log("\nTransaction Hash: ", setAdminOnERC721TxHash);
        console.log(
            `Transaction Details: https://explorer.public.zkevm-test.net/tx/${setAdminOnERC721TxHash}`
        );
        console.log(`\nAdmin set successfully\n`);
    } catch (error) {
        console.log("Error in setAdmin: ", error);
        process.exit(1);
    }
}

setAdmin();
