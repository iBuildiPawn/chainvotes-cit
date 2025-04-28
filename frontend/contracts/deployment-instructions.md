# Deployment Instructions for Sepolia Testnet

## 1. Update Environment Variables

You can use our helper script to update the environment variables:

```bash
node update-env.js
```

This will prompt you for:
- Your private key (without 0x prefix)
- Your Etherscan API key
- Your wallet address (contract owner)

Alternatively, you can manually edit the `.env` file in the `frontend/contracts` directory.

## 2. Deploy the Contract

Run the following command from the `frontend/contracts` directory:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

This will:
- Deploy the contract to Sepolia testnet
- Update the contract address in the frontend configuration
- Save deployment information to `deployments.json`

## 3. View Deployment Summary

After deployment, view a summary of the deployment:

```bash
npx hardhat run scripts/deployment-summary.ts --network sepolia
```

This will show:
- Contract address
- Network information
- Deployment timestamp
- Etherscan link
- Next steps

## 4. Verify the Contract on Etherscan

After deployment, verify the contract on Etherscan by running:

```bash
npx hardhat run scripts/verify-etherscan.ts --network sepolia
```

This will submit the contract source code to Etherscan for verification.

## 5. Verify the Contract Functionality

Run the following command to verify that the contract is working correctly:

```bash
npx hardhat run scripts/verify.ts --network sepolia
```

This will check if the contract is deployed and accessible.

## 6. Test the Contract

Make sure to test the contract functionality after deployment to ensure everything works as expected:

1. Create a new campaign
2. Add positions
3. Register candidates
4. Test voting with different wallets for the same position

## 7. Update Frontend Configuration

The deployment script automatically updates the contract address in the frontend configuration, but you may need to restart your frontend development server for the changes to take effect.

## Security Notes

- Never commit your private key to version control
- Consider using environment variables or a secure vault for production deployments
- Always test thoroughly on testnet before deploying to mainnet

## Troubleshooting

If you encounter any issues during deployment:

1. Check that your wallet has enough Sepolia ETH for gas fees
2. Verify that your RPC URL is correct and working
3. Make sure your private key is entered correctly
4. Check the Hardhat and Etherscan error messages for specific issues 