import { providers, Wallet } from "ethers";
import { config } from "dotenv";
import ps from "prompt-sync";
const prompt = ps();
import { abi } from "../../artifacts/src/ERC1155Token.sol/TestTokenERC1155.json";
import { ethers } from "hardhat";
config();

const pKey: any = process.env.PRIVATE_KEY;
const erc1155Token_address: any = process.env.ERC1155_TOKEN;
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
        const erc1155_ABI = abi;
        const erc1155_contract = new ethers.Contract(erc1155Token_address, erc1155_ABI, provider);
        const erc1155_connect = erc1155_contract.connect(signer);

        const setAdminOnERC1155Tx = await erc1155_connect.setAdmin(adminAddress, adminStatus);
        await setAdminOnERC1155Tx.wait();

        const setAdminOnERC1155TxHash = setAdminOnERC1155Tx.hash;

        console.log("\nTransaction Hash: ", setAdminOnERC1155TxHash);
        console.log(
            `Transaction Details: https://explorer.public.zkevm-test.net/tx/${setAdminOnERC1155TxHash}`
        );
        console.log(`\nAdmin set successfully\n`);
    } catch (error) {
        console.log("Error in setAdmin: ", error);
        process.exit(1);
    }
}

setAdmin();
