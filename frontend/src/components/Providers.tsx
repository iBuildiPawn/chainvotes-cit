'use client';

import { WagmiProvider, http, createConfig } from 'wagmi'
import { sepolia } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'
import { ThemeProvider } from '@/components/ThemeProvider';
import { useState } from 'react';

// Create Wagmi config outside component to prevent recreation on renders
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL),
  },
  connectors: [
    injected()
  ]
})

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance inside component to preserve state
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Prevent auto refetching which can cause hydration issues
        refetchOnWindowFocus: false,
        // Add retry delay to prevent rapid state updates
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}