#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

// Read the current .env file
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}

console.log('\n=== Sepolia Deployment Configuration ===\n');
console.log('This script will update your .env file with the necessary values for deployment.');
console.log('WARNING: Your private key is sensitive information. Never share it or commit it to version control.\n');

const updateEnvValue = (content, key, value) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return `${content}\n${key}=${value}`;
  }
};

const promptForValue = (prompt, key, defaultValue = '') => {
  return new Promise((resolve) => {
    rl.question(`${prompt} ${defaultValue ? `(current: ${defaultValue})` : ''}: `, (answer) => {
      const value = answer.trim() || defaultValue;
      if (value) {
        envContent = updateEnvValue(envContent, key, value);
        resolve(value);
      } else {
        console.log('This value is required. Please provide a value.');
        promptForValue(prompt, key, defaultValue).then(resolve);
      }
    });
  });
};

const extractCurrentValue = (content, key) => {
  const regex = new RegExp(`^${key}=(.*)$`, 'm');
  const match = content.match(regex);
  return match ? match[1] : '';
};

const main = async () => {
  try {
    // Extract current values
    const currentPrivateKey = extractCurrentValue(envContent, 'PRIVATE_KEY');
    const currentEtherscanKey = extractCurrentValue(envContent, 'ETHERSCAN_API_KEY');
    const currentOwnerAddress = extractCurrentValue(envContent, 'OWNER_ADDRESS');

    // Prompt for new values
    await promptForValue('Enter your private key (without 0x prefix)', 'PRIVATE_KEY', 
      currentPrivateKey === 'your_private_key_here' ? '' : currentPrivateKey);
    
    await promptForValue('Enter your Etherscan API key', 'ETHERSCAN_API_KEY', 
      currentEtherscanKey === 'your_etherscan_key_here' ? '' : currentEtherscanKey);
    
    await promptForValue('Enter your wallet address (contract owner)', 'OWNER_ADDRESS', 
      currentOwnerAddress === 'your_owner_address_here' ? '' : currentOwnerAddress);

    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n.env file updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy the contract: npx hardhat run scripts/deploy.ts --network sepolia');
    console.log('2. Verify the contract: npx hardhat run scripts/verify.ts --network sepolia');
    
  } catch (error) {
    console.error('Error updating .env file:', error.message);
  } finally {
    rl.close();
  }
};

main(); 