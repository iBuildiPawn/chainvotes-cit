import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

// Dynamically get the contract address from the frontend configuration
const frontendConfigPath = path.join(__dirname, '../../src/lib/contracts/voting.ts');
let frontendConfig = fs.readFileSync(frontendConfigPath, 'utf8');
const addressMatch = frontendConfig.match(/VOTING_CONTRACT_ADDRESS\s*=\s*['"]([^'"]+)['"]/);
const VOTING_CONTRACT_ADDRESS = addressMatch ? addressMatch[1] : '';

if (!VOTING_CONTRACT_ADDRESS) {
  console.error('Could not find contract address in frontend configuration');
  process.exit(1);
}

console.log(`Using contract address: ${VOTING_CONTRACT_ADDRESS}`);

const VOTING_CONTRACT_ABI = [
  {
    inputs: [],
    name: "nextCampaignId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

async function verifyContract() {
  console.log("Verifying contract deployment...");
  
  // Get RPC URL from environment variable or use default
  const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/yiZ34zOTo1in4Mm5rZUdLpxMB7Wzhnub';
  
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl)
  });

  try {
    // First check if there's any code at the address
    const code = await client.getBytecode({ address: VOTING_CONTRACT_ADDRESS });
    if (!code || code === '0x') {
      throw new Error('No contract code found at the specified address');
    }
    console.log('Contract code found at address');

    console.log("Checking owner...");
    const owner = await client.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: 'owner',
      args: []
    });
    console.log(`Contract owner: ${owner}`);

    console.log("Checking nextCampaignId...");
    const nextId = await client.readContract({
      address: VOTING_CONTRACT_ADDRESS,
      abi: VOTING_CONTRACT_ABI,
      functionName: 'nextCampaignId',
      args: []
    });
    console.log(`Next campaign ID: ${nextId}`);
    
    console.log("Contract verification successful!");
    
  } catch (error) {
    console.error("Contract verification failed:", error);
    process.exit(1);
  }
}

verifyContract().catch(console.error);