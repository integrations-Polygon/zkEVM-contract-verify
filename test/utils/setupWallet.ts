import dotenv from "dotenv";
dotenv.config();
import { ethers, providers, Signer } from "ethers";

const mnemonics: any = process.env.MNEMONICS;
const zkEVM_RPC: any = process.env.ZKEVM_RPC_URL;

let zkEVM_provider: any;
let bobPrivateKey: any;
let ownerSigner: Signer, adminSigner: Signer, userSigner: Signer, aliceSigner: Signer, bobSigner: Signer;

const setupWallet = async () => {
    try {
        let derivedNodeArray: any = [];
        // get zkEVM provider
        zkEVM_provider = new providers.JsonRpcProvider(zkEVM_RPC);
        const HDNode = ethers.utils.HDNode.fromMnemonic(mnemonics);
        for (let i = 0; i < 5; i++) {
            derivedNodeArray[i] = HDNode.derivePath(`m/44'/60'/0'/0/${i}`);
        }
        bobPrivateKey = derivedNodeArray[4].privateKey;

        ownerSigner = new ethers.Wallet(derivedNodeArray[0].privateKey, zkEVM_provider);
        adminSigner = new ethers.Wallet(derivedNodeArray[1].privateKey, zkEVM_provider);
        userSigner = new ethers.Wallet(derivedNodeArray[2].privateKey, zkEVM_provider);
        aliceSigner = new ethers.Wallet(derivedNodeArray[3].privateKey, zkEVM_provider);
        bobSigner = new ethers.Wallet(derivedNodeArray[4].privateKey, zkEVM_provider);

        return derivedNodeArray;
    } catch (error) {
        console.log("error while setting up wallets: ", error);
    }
};

setupWallet();

export {
    setupWallet,
    zkEVM_provider,
    ownerSigner,
    adminSigner,
    userSigner,
    aliceSigner,
    bobSigner,
    bobPrivateKey,
};
