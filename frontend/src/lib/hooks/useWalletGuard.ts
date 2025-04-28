import { useCallback, useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useRouter } from 'next/navigation'
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '../contracts/voting'
import { useIsMounted } from './useIsMounted'

export function useWalletGuard() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const publicClient = usePublicClient()
  const [isOwner, setIsOwner] = useState(false)
  const isMounted = useIsMounted()

  useEffect(() => {
    if (!isMounted) return;

    const checkOwner = async () => {
      if (!address || !publicClient) {
        setIsOwner(false)
        return
      }

      try {
        const owner = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'owner'
        }) as `0x${string}`
        
        // Only update state if component is still mounted
        if (isMounted) {
          setIsOwner(owner.toLowerCase() === address.toLowerCase())
        }
      } catch (err) {
        console.error('Error checking owner status:', err)
        if (isMounted) {
          setIsOwner(false)
        }
      }
    }

    checkOwner()
  }, [address, publicClient, isMounted])

  const requireWallet = useCallback(async (callback: () => Promise<void>) => {
    if (!isMounted) return;
    
    if (!isConnected) {
      router.push('/auth/connect')
      return
    }
    await callback()
  }, [isConnected, router, isMounted])

  const requireOwner = useCallback(async (callback: () => Promise<void>) => {
    if (!isMounted) return;

    if (!isConnected) {
      router.push('/auth/connect')
      return
    }
    if (!isOwner) {
      throw new Error('Only the contract owner can perform this action')
    }
    await callback()
  }, [isConnected, isOwner, router, isMounted])

  // Don't expose any state until mounted
  if (!isMounted) {
    return {
      requireWallet: async () => {},
      requireOwner: async () => {},
      isOwner: false
    }
  }

  return {
    requireWallet,
    requireOwner,
    isOwner
  }
}