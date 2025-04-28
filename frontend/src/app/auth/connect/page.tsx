import WalletConnect from '@/components/ui/WalletConnect'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ConnectPage() {
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (isConnected) {
      router.back()
    }
  }, [isConnected, router])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-8">You need to connect your wallet to access this feature</p>
        <WalletConnect />
      </div>
    </div>
  )
}