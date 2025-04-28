# ChainVotes

<div align="center">
  <img src="frontend/public/chainvotes_icon.svg" alt="ChainVotes Logo" width="120" />
  
  ### Secure Voting Platform on Ethereum L2
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org/)
  [![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636.svg)](https://soliditylang.org/)
</div>

## Overview

ChainVotes is a decentralized voting platform built on Ethereum Layer 2 (Sepolia testnet) that enables secure, transparent, and verifiable elections. The platform supports various election types, from organizational voting to large-scale national elections.

### Key Features

- **Decentralized Voting**: Secure, tamper-proof voting using blockchain technology
- **Campaign Management**: Create and manage voting campaigns with multiple positions
- **Bulk Operations**: Support for batch candidate registration and position creation
- **Real-time Results**: Live vote counting and result visualization
- **Mobile Responsive**: User-friendly interface that works across all devices
- **CSV Import**: Easy candidate and position data import via spreadsheets

## Getting Started

### Prerequisites

- Node.js 18 or later
- Yarn package manager
- MetaMask or any Web3 wallet
- Sepolia testnet ETH for transactions

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/chainvotes.git
cd chainvotes
\`\`\`

2. Install dependencies:
\`\`\`bash
cd frontend
yarn install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Edit .env.local with your configuration values.

4. Start the development server:
\`\`\`bash
yarn dev
\`\`\`

### Smart Contract Deployment

1. Install Hardhat dependencies:
\`\`\`bash
cd frontend/contracts
yarn install
\`\`\`

2. Deploy to Sepolia testnet:
\`\`\`bash
yarn hardhat deploy --network sepolia
\`\`\`

## Project Structure

- `/frontend` - Next.js frontend application
  - `/src` - Source code
  - `/contracts` - Smart contracts and deployment scripts
  - `/public` - Static assets and sample data
- `/docs` - Project documentation

## Usage

### Creating a Campaign

1. Connect your Web3 wallet
2. Navigate to "Create Campaign"
3. Fill in campaign details
4. Add positions and candidates
5. Launch the campaign

### Importing Candidates

The platform supports CSV import for bulk candidate registration. Use the provided template:

\`\`\`csv
name,position,bio,imageUrl
John Doe,President,"Experienced leader...",https://...
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Smart contracts with [Hardhat](https://hardhat.org/)
- UI components with [TailwindCSS](https://tailwindcss.com/)
- Web3 integration with [Viem](https://viem.sh/)