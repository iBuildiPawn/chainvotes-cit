import { type NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    ALCHEMY_SEPOLIA_URL: process.env.ALCHEMY_SEPOLIA_URL || 'https://eth-sepolia.g.alchemy.com/v2/yiZ34zOTo1in4Mm5rZUdLpxMB7Wzhnub',
    NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS
  }
}

export default nextConfig;
