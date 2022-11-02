const hre = require("hardhat");

async function main() {
  
  const Contract = await hre.ethers.getContractFactory("TestERC165");
  const contract = await Contract.deploy();

  await contract.deployed();

  console.log("deployed to:", contract.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });