import { sleep } from "./sleep";
import { isConfirmed } from "./isConfirmed";

/*  
  - Total wait time is 5.3 mins (5000ms  * 64)
  - Every 5 seconds check for the block confirmations status
  - If the tx hash gets confirmed by 64 blocks within 5.3 mins then return the tx receipt
  - Else return null and retry
  - Simply change the value for block according to your block confirmation check
*/

const waitForConfirmation = async (provider, txHash) => {
    try {
        let i = 0;
        let ms = 10000;
        let blocksConfirmationCheck = 5;
        while (i < blocksConfirmationCheck) {
            if (await isConfirmed(provider, txHash, blocksConfirmationCheck)) {
                console.log("\n");
                console.log(txHash, "was mined successfully & confirmed by 5 blocks");
                const txReceipt = await provider.getTransactionReceipt(txHash);
                if (txReceipt !== null) return txReceipt;
            }
            i += 1;
            await sleep(ms);
        }
        return null;
    } catch (error) {
        console.log(`error in waitForConfirmation: ${error}`);
        return null;
    }
};

export { waitForConfirmation };
