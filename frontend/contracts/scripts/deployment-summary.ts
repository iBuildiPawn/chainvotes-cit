import * as fs from 'fs';
import * as path from 'path';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('\n=== Deployment Summary ===\n');

  // Get contract address from frontend config
  const frontendConfigPath = path.join(__dirname, '../../src/lib/contracts/voting.ts');
  let frontendConfig = fs.readFileSync(frontendConfigPath, 'utf8');
  const addressMatch = frontendConfig.match(/VOTING_CONTRACT_ADDRESS\s*=\s*['"]([^'"]+)['"]/);
  const contractAddress = addressMatch ? addressMatch[1] : '';

  if (!contractAddress) {
    console.error('Error: Could not find contract address in frontend configuration');
    process.exit(1);
  }

  // Get deployment info
  const deploymentsPath = path.join(__dirname, '../deployments.json');
  let deploymentInfo = { network: 'unknown', timestamp: 'unknown', blockNumber: 'unknown' };
  
  if (fs.existsSync(deploymentsPath)) {
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
    if (deployments.length > 0) {
      const latestDeployment = deployments[deployments.length - 1];
      deploymentInfo = {
        network: latestDeployment.network,
        timestamp: latestDeployment.timestamp,
        blockNumber: latestDeployment.blockNumber
      };
    }
  }

  // Print summary
  console.log('Contract Address:', contractAddress);
  console.log('Network:', deploymentInfo.network);
  console.log('Deployed at:', deploymentInfo.timestamp);
  console.log('Block Number:', deploymentInfo.blockNumber);
  
  // Check if contract is verified on Etherscan
  console.log('\nEtherscan Link:');
  console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // Check contract on-chain
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      console.log('\nCannot check contract on-chain: SEPOLIA_RPC_URL not set');
      return;
    }
    
    const client = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl)
    });
    
    const code = await client.getBytecode({ address: contractAddress });
    if (!code || code === '0x') {
      console.log('\nWarning: No contract code found at the specified address');
    } else {
      console.log('\nContract is deployed and has code on-chain ✓');
    }
  } catch (error) {
    console.error('\nError checking contract on-chain:', error.message);
  }
  
  console.log('\n=== Next Steps ===');
  console.log('1. Verify contract on Etherscan: npx hardhat run scripts/verify-etherscan.ts --network sepolia');
  console.log('2. Test contract functionality');
  console.log('3. Restart frontend development server to use the new contract address');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 