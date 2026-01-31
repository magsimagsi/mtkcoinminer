// deployMTK.js - Run this in Remix IDE or with Hardhat

const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const MTKToken = await hre.ethers.getContractFactory("MTKToken");
  
  // Deploy the contract
  const mtkToken = await MTKToken.deploy();
  
  await mtkToken.deployed();
  
  console.log("✅ MTK Token deployed to:", mtkToken.address);
  console.log("✅ Transaction hash:", mtkToken.deployTransaction.hash);
  console.log("✅ Block number:", mtkToken.deployTransaction.blockNumber);
  
  // Verify on Etherscan (optional)
  // await hre.run("verify:verify", {
  //   address: mtkToken.address,
  //   constructorArguments: [],
  // });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});