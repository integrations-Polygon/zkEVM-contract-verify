import { ethers } from "hardhat";
import { Example__factory } from "../../src/types";
import { ExampleProxy__factory } from "../../src/types";

async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deploy() {
    // get the implementation contract to deploy
    const Example = (await ethers.getContractFactory("Example")) as Example__factory;
    const example = await Example.deploy();
    console.log("\nDeploying Implementation contract on zkEVM chain....");
    await delay(20000);
    console.log("\nImplementation contract deployed at: ", example.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${example.address}`);

    // get the proxy contract to deploy

    const ExampleProxy = (await ethers.getContractFactory("ExampleProxy")) as ExampleProxy__factory;
    const exampleProxy = await ExampleProxy.deploy(example.address, "0x");
    console.log("\nDeploying proxy contract on zkEVM chain....");
    await delay(20000);
    console.log("\ncontract deployed at: ", exampleProxy.address);
    console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${exampleProxy.address}`);
}

deploy();
