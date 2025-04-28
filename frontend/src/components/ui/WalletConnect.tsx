'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { WalletIcon } from '@heroicons/react/24/outline'
import { useIsMounted } from '@/lib/hooks/useIsMounted'
import { truncateAddress } from '@/lib/utils/address';
import { useCallback } from 'react';

export function WalletConnect({ className = "" }: { className?: string }) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading } = useConnect()
  const { disconnect } = useDisconnect()
  const isMounted = useIsMounted()

  // Find the MetaMask connector
  const connector = connectors[0]; // Just use the first connector for simplicity

  const handleConnect = useCallback(() => {
    console.log('Connect button clicked');
    if (connector) {
      connect({ connector });
    }
  }, [connector, connect]);

  const handleDisconnect = useCallback(() => {
    console.log('Disconnect button clicked');
    disconnect();
  }, [disconnect]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <span className="text-foreground font-medium">{truncateAddress(address)}</span>
        <button 
          type="button"
          onClick={handleDisconnect}
          className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500/10 font-medium px-4 py-2 rounded-md transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className={`bg-primary-500 hover:bg-primary-600 text-black font-semibold py-2 px-4 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors transform hover:-translate-y-0.5 ${className}`}
    >
      <WalletIcon className="h-5 w-5" />
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}