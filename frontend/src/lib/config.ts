import { sepolia } from 'viem/chains'

export const CHAIN_ID = sepolia.id
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'