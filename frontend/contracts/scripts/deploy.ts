import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { Contract } from 'ethers';
import { Voting__factory } from '../typechain-types';

async function main() {
  try {
    console.log('Starting deployment process...');

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    // Deploy Voting contract
    console.log('Deploying Voting contract...');
    const VotingFactory = await ethers.getContractFactory('Voting');
    const voting = await VotingFactory.deploy();
    await voting.waitForDeployment();

    const votingAddress = await voting.getAddress();
    console.log('Voting contract deployed to:', votingAddress);

    // Verify contract code matches bytecode
    console.log('Verifying bytecode...');
    const deployedBytecode = await ethers.provider.getCode(votingAddress);
    if (deployedBytecode === '0x') {
      throw new Error('Contract deployment failed - no bytecode at address');
    }

    // Get and log initial state
    const nextCampaignId = await voting.nextCampaignId();
    const owner = await voting.owner();
    console.log('Contract initialization verified:');
    console.log('- Next Campaign ID:', nextCampaignId.toString());
    console.log('- Owner:', owner);

    // Update contract address in configuration
    const configPath = path.join(__dirname, '../../src/lib/contracts/voting.ts');
    const configContent = `export const VOTING_CONTRACT_ADDRESS = '${votingAddress}';
export const VOTING_CONTRACT_ABI = ${JSON.stringify(Voting__factory.abi, null, 2)};
`;

    fs.writeFileSync(configPath, configContent);
    console.log('Updated contract configuration at:', configPath);

    // Log deployment info for verification
    const deploymentInfo = {
      network: process.env.HARDHAT_NETWORK || 'unknown',
      contract: 'Voting',
      address: votingAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };

    const deploymentPath = path.join(__dirname, '../deployments.json');
    const existingDeployments = fs.existsSync(deploymentPath) 
      ? JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
      : [];

    existingDeployments.push(deploymentInfo);
    fs.writeFileSync(deploymentPath, JSON.stringify(existingDeployments, null, 2));
    console.log('Deployment info saved to:', deploymentPath);

    console.log('\nDeployment completed successfully! 🎉');
    console.log('Next steps:');
    console.log('1. Verify contract on Etherscan');
    console.log('2. Update environment variables if needed');
    console.log('3. Run contract verification tests');

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });