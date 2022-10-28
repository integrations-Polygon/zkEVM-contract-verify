import { ethers, providers } from "ethers";

let balance: any = [];
const zkEVM_RPC: any = process.env.ZKEVM_RPC_URL;
const zkEVM_provider = new providers.JsonRpcProvider(zkEVM_RPC);

/*  
  - get the balances of the wallet addresses used for testing.
  - checks if any of the wallet addresses balance is 0
  - if any wallet addresses balance is 0 then terminate.
*/

const getBalances = async (derivedNode) => {
    try {
        for (let i = 0; i < 5; i++) {
            balance[i] = await zkEVM_provider.getBalance(derivedNode[i].address);
            const balanceInEth = ethers.utils.formatEther(balance[i]);
            console.log(`Balance in the address ${derivedNode[i].address} is ${balanceInEth} ETH`);
        }
    } catch (error) {
        console.log("\nError while getting balance: ", error);
    }
};

const checkBalances = async (derivedNode) => {
    try {
        await getBalances(derivedNode);
        for (let i = 0; i < balance.length; i++) {
            if (balance[i] == 0) {
                console.log("\nTerminating the unit test since, one or more wallet address has 0 balance");
                process.exit(0);
            }
        }
    } catch (error) {
        console.log("\nError while getting balance: ", error);
    }
};

export { checkBalances };
