import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Starting Etherscan verification...');

  // Check if Etherscan API key is available
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error('Error: ETHERSCAN_API_KEY not found in environment variables');
    console.log('Please set your Etherscan API key in the .env file');
    process.exit(1);
  }

  // Dynamically get the contract address from the frontend configuration
  const frontendConfigPath = path.join(__dirname, '../../src/lib/contracts/voting.ts');
  let frontendConfig = fs.readFileSync(frontendConfigPath, 'utf8');
  const addressMatch = frontendConfig.match(/VOTING_CONTRACT_ADDRESS\s*=\s*['"]([^'"]+)['"]/);
  const contractAddress = addressMatch ? addressMatch[1] : '';

  if (!contractAddress) {
    console.error('Error: Could not find contract address in frontend configuration');
    process.exit(1);
  }

  console.log(`Verifying contract at address: ${contractAddress}`);

  try {
    // Run the verify task from Hardhat
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: [],
    });

    console.log('Contract verification submitted successfully!');
    console.log('Check Etherscan in a few minutes to confirm verification status.');
  } catch (error) {
    console.error('Verification failed:', error);
    
    // Check if it's already verified
    if (error.message.includes('already verified')) {
      console.log('Contract is already verified on Etherscan.');
    } else {
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 