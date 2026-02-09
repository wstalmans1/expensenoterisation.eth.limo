const fs = require('fs');
const path = require('path');
const { ethers, upgrades, artifacts, network } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  const ExpenseRegistry = await ethers.getContractFactory('ExpenseRegistry');
  const initializerArgs = [deployer.address];
  const proxy = await upgrades.deployProxy(ExpenseRegistry, initializerArgs, {
    kind: 'uups',
  });

  await proxy.waitForDeployment();
  const address = await proxy.getAddress();
  console.log('ExpenseRegistry proxy deployed to:', address);

  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(address);
  const initializerData = ExpenseRegistry.interface.encodeFunctionData(
    'initialize',
    initializerArgs
  );

  const artifact = await artifacts.readArtifact('ExpenseRegistry');
  const contractInfo = {
    address,
    abi: artifact.abi,
  };

  const frontendPath = path.join(
    __dirname,
    '../../../apps/frontend/src/contracts/ExpenseRegistry.json'
  );
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(contractInfo, null, 2));
  console.log('Contract ABI saved to apps/frontend/src/contracts/ExpenseRegistry.json');

  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    proxyAddress: address,
    implementationAddress,
    initializerArgs,
    initializerData,
  };

  const deploymentPath = path.join(__dirname, '../deployments');
  fs.mkdirSync(deploymentPath, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentPath, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info saved to deployments/${network.name}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
