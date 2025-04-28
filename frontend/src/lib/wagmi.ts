import { http, createConfig, fallback } from 'wagmi'
import { type HttpTransportConfig } from 'viem'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { RPC_URL } from './config'

// Public RPC endpoints with CORS support as fallbacks
const FALLBACK_RPCS = [
  '/api/rpc', // Local Next.js API route proxy (prioritized)
  'https://eth-sepolia.g.alchemy.com/v2/demo',
  'https://rpc.sepolia.org',
  'https://rpc2.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' // Public Infura endpoint
]

// Common transport options for better resilience
const transportOptions: HttpTransportConfig = {
  retryCount: 5,
  retryDelay: 1500,
  timeout: 15000
}

// Log the RPC configuration
console.log('RPC Configuration:');
console.log('Primary RPC URL:', RPC_URL);
console.log('Fallback RPCs:', FALLBACK_RPCS);

// Create a more resilient transport configuration
export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback([
      // Always use the local API proxy first to avoid CORS issues
      http('/api/rpc', {
        ...transportOptions,
        fetchOptions: {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        },
        onRequest: ({ request }) => {
          console.log('Making RPC request to local proxy:', request.method);
          return request;
        },
        onResponse: (response) => {
          if (!response.ok) {
            console.warn('Local proxy response error:', response.status, response.statusText);
          } else {
            console.log('Local proxy response successful');
          }
          return response;
        },
        onError: (error) => {
          console.error('Local proxy error:', error);
          throw error;
        }
      }),
      // Then try all fallbacks in order
      ...FALLBACK_RPCS.slice(1).map(url => http(url, {
        ...transportOptions,
        onResponse: (response) => {
          if (!response.ok) {
            console.warn(`RPC response error from ${url}:`, response.status, response.statusText);
          }
          return response;
        }
      }))
    ])
  },
  connectors: [
    injected()
  ]
})