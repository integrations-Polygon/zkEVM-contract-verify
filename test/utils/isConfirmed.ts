/*
  - If the tx or tx block number is null then return false
  - Get the latest block number and subract it with the current
    transaction block number to get the block confirmation number
  - If the result of subtraction is equal to 12 return true
  - Else return false 
*/

const isConfirmed = async (provider, txHash, blocksConfirmationCheck) => {
    try {
        // Get the transaction hash
        const tx = await provider.getTransaction(txHash);

        // Check if the transaction and transaction block number exist
        if (!tx || !tx.blockNumber) return false;

        // Get the lastest block number from the network
        const lastestBlockNumber = await provider.getBlockNumber();

        // Differenciate between lastest block number
        // and your transaction block number results in
        // the latest confirmation block number and compare
        // it with your require block confirmation number
        if (lastestBlockNumber - tx.blockNumber >= blocksConfirmationCheck) return true;

        return false;
    } catch (error) {
        console.log(`Error in isConfirmed: ${error}`);
        return false;
    }
};

export { isConfirmed };
