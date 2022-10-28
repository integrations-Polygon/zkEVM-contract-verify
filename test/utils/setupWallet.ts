import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";

const mnemonics: any = process.env.MNEMONICS;

const setupWallets = async () => {
    try {
        let derivedNodeArray: any = [];
        const HDNode = ethers.utils.HDNode.fromMnemonic(mnemonics);
        for (let i = 0; i < 5; i++) {
            derivedNodeArray[i] = HDNode.derivePath(`m/44'/60'/0'/0/${i}`);
        }
        return derivedNodeArray;
    } catch (error) {
        console.log("error while setting up wallets: ", error);
    }
};

export { setupWallets };
