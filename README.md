# TEST VERIFY SMART CONTRACT ON ZKEVM TESTNET

This repository contains all the necessary steps to deploy and verify smart contracts on ZKEVM testnet by adding a custom chain in hardhat config etherscan obj and utilizing the blockscout block explorer API for contract verification.

## GETTING STARTED
- Clone this repository
```sh
git clone https://github.com/integrations-Polygon/zkEVM-contract-verify.git
```
- Navigate to `zkEVM-testnet-verify` folder
```sh
cd zkEVM-testnet-verify
```

- Install dependencies
```sh
yarn
```

- Create `.env` file
```sh
cp .example.env .env
```

- Configure environment variables in `.env`
```
PRIVATE_KEY = your_private_key
ZKEVM_RPC_URL = your_zkevm_rpc_url
```
- Compile the smart contract and its types
```sh
npx hardhat compile
```

- Deploy the smart contracts
```sh 
npx hardhat run --network zkEVM scripts/ERC20Token_deploy.ts
```
```sh 
npx hardhat run --network zkEVM scripts/ERC721Token_deploy.ts
```
```sh 
npx hardhat run --network zkEVM scripts/ERC1155Token_deploy.ts
```

- Verify the deployed smart contracts
```sh 
npx hardhat verify --network zkEVM <DEPLOYED_SMART_CONTRACT_ADDRESS>
```