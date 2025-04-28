import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { useState, useCallback, useMemo } from 'react'
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '../contracts/voting'
import { type Hash, type Abi, type ContractFunctionExecutionError } from 'viem'
import { assertSepolia, NetworkError } from '../utils/network'

const VOTING_CONTRACT_CONFIG = {
  address: VOTING_CONTRACT_ADDRESS,
  abi: VOTING_CONTRACT_ABI as Abi
} as const;

interface TransactionReceipt {
  hash: Hash
  status: 'success' | 'reverted'
}

interface VotingState {
  isLoading: boolean
  error: string | null
  transactionHash: Hash | null
  status: 'idle' | 'waiting' | 'mining' | 'success' | 'error'
}

interface VoteInput {
  candidateId: bigint
  positionId: bigint
}

export interface VoteCounts {
  [positionId: string]: {
    [candidateId: string]: {
      count: number;
      voters: string[];
    };
  };
}

type CandidateResult = { result: [string, string, bigint, boolean], status: 'success' | 'failure' };
type VoteCountResult = { result: bigint, status: 'success' | 'failure' };

export function useVoting() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const [state, setState] = useState<VotingState>({
    isLoading: false,
    error: null,
    transactionHash: null,
    status: 'idle'
  })
  const [voteCounts, setVoteCounts] = useState<Record<string, VoteCounts>>({})

  const checkNetwork = useCallback(() => {
    try {
      assertSepolia(chainId)
    } catch (err) {
      if (err instanceof NetworkError) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: err.message
        }))
      }
      throw err
    }
  }, [chainId])

  // Single vote function
  const vote = useCallback(async (campaignId: string, candidateId: string): Promise<TransactionReceipt | undefined> => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected')
    }

    checkNetwork()
    setState(prev => ({ ...prev, isLoading: true, status: 'waiting', error: null }))

    try {
      const { request } = await publicClient.simulateContract({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'vote',
        args: [BigInt(campaignId), BigInt(candidateId)],
        account: address,
      }).catch((err) => {
        const errorMessage = err.message || 'Contract simulation failed'
        if (errorMessage.includes('Campaign is not active')) {
          throw new Error('This campaign is not currently active')
        }
        if (errorMessage.includes('Already voted')) {
          throw new Error('You have already voted in this campaign')
        }
        if (errorMessage.includes('Campaign is not in voting period')) {
          throw new Error('This campaign is not in its voting period')
        }
        throw err
      })

      setState(prev => ({ ...prev, status: 'mining' }))
      const hash = await walletClient.writeContract(request)
      
      setState(prev => ({ ...prev, transactionHash: hash }))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const status = receipt.status === 'success' ? 'success' : 'error'
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        status,
        error: status === 'error' ? 'Transaction failed' : null 
      }))

      return {
        hash,
        status: receipt.status
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          status: 'error',
          error: err.message
        }))
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while voting'
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          status: 'error',
          error: errorMessage 
        }))
      }
      throw err
    }
  }, [publicClient, walletClient, address, checkNetwork])

  // Batch vote function
  const voteBatch = useCallback(async (campaignId: string, votes: Array<{ candidateId: string, positionId: string }>): Promise<TransactionReceipt | undefined> => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected')
    }

    checkNetwork()
    setState(prev => ({ ...prev, isLoading: true, status: 'waiting', error: null }))

    try {
      // Convert inputs to BigInt
      const voteInputs: VoteInput[] = votes.map(vote => ({
        candidateId: BigInt(vote.candidateId),
        positionId: BigInt(vote.positionId)
      }))

      const { request } = await publicClient.simulateContract({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'voteBatch',
        args: [BigInt(campaignId), voteInputs],
        account: address,
      }).catch((err) => {
        const errorMessage = err.message || 'Contract simulation failed'
        if (errorMessage.includes('Campaign is not active')) {
          throw new Error('This campaign is not currently active')
        }
        if (errorMessage.includes('Already voted')) {
          throw new Error('You have already voted in this campaign')
        }
        if (errorMessage.includes('Campaign is not in voting period')) {
          throw new Error('This campaign is not in its voting period')
        }
        if (errorMessage.includes('Cannot vote multiple times for same position')) {
          throw new Error('You cannot vote multiple times for the same position')
        }
        if (errorMessage.includes('Candidate does not exist')) {
          throw new Error('One or more selected candidates do not exist')
        }
        if (errorMessage.includes('Candidate not registered for this position')) {
          throw new Error('One or more candidates are not registered for the selected positions')
        }
        throw err
      })

      setState(prev => ({ ...prev, status: 'mining' }))
      const hash = await walletClient.writeContract(request)
      
      setState(prev => ({ ...prev, transactionHash: hash }))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const status = receipt.status === 'success' ? 'success' : 'error'
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        status,
        error: status === 'error' ? 'Transaction failed' : null 
      }))

      return {
        hash,
        status: receipt.status
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          status: 'error',
          error: err.message
        }))
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while submitting votes'
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          status: 'error',
          error: errorMessage 
        }))
      }
      throw err
    }
  }, [publicClient, walletClient, address, checkNetwork])

  const getVoteCount = useCallback(async (campaignId: string, candidateId: string) => {
    if (!publicClient) return 0n
    
    try {
      return await publicClient.readContract({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'getVoteCount',
        args: [BigInt(campaignId), BigInt(candidateId)]
      }) as bigint
    } catch (err) {
      console.error('Error getting vote count:', err)
      return 0n
    }
  }, [publicClient])

  const hasVoted = useCallback(async (campaignId: string) => {
    if (!publicClient || !address) return false

    try {
      return await publicClient.readContract({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'hasVoted',
        args: [BigInt(campaignId), address]
      }) as boolean
    } catch (err) {
      console.error('Error checking vote status:', err)
      return false
    }
  }, [publicClient, address])

  const submitVote = useCallback(async (
    campaignId: string,
    positionIds: bigint[],
    candidateIds: bigint[]
  ) => {
    if (!walletClient) throw new Error('Wallet not connected');
    assertSepolia(chainId);

    const hash = await walletClient.writeContract({
      ...VOTING_CONTRACT_CONFIG,
      functionName: 'submitVotes',
      args: [BigInt(campaignId), positionIds, candidateIds]
    });

    const receipt = await publicClient?.waitForTransactionReceipt({ hash });

    // Update vote counts after successful submission
    await fetchVoteCounts(campaignId);

    return receipt;
  }, [publicClient, walletClient, chainId]);

  // Memoized vote count fetching with batching and debouncing
  const fetchVoteCounts = useCallback(async (campaignId: string): Promise<VoteCounts> => {
    if (!publicClient) return {};

    try {
      // Get campaign info to get number of candidates
      const info = await publicClient.readContract({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'getCampaignInfo',
        args: [BigInt(campaignId)]
      }) as [string, string, bigint, bigint, boolean, bigint, bigint];

      const candidateCount = Number(info[6]);
      const counts: VoteCounts = {};

      // Prepare multicall for getting candidates and vote counts
      const candidateCalls = Array.from({ length: candidateCount }, (_, i) => ({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'getCandidate',
        args: [BigInt(campaignId), BigInt(i + 1)]
      }));

      const voteCountCalls = Array.from({ length: candidateCount }, (_, i) => ({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'getVoteCount',
        args: [BigInt(campaignId), BigInt(i + 1)]
      }));

      const voterCalls = Array.from({ length: candidateCount }, (_, i) => ({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'getCandidateVoters',
        args: [BigInt(campaignId), BigInt(i + 1)]
      }));

      // Execute multicall for candidates, vote counts, and voters
      const [candidateResults, voteCountResults, voterResults] = await Promise.all([
        publicClient.multicall({ contracts: candidateCalls }) as Promise<CandidateResult[]>,
        publicClient.multicall({ contracts: voteCountCalls }) as Promise<VoteCountResult[]>,
        publicClient.multicall({ contracts: voterCalls }) as Promise<{ result: string[], status: 'success' | 'failure' }[]>
      ]);

      // Process results in memory before state update
      const processedCounts = candidateResults.reduce<VoteCounts>((acc, candidate, index) => {
        if (candidate.status === 'success') {
          const [, , positionId, exists] = candidate.result;
          if (exists) {
            const positionIdStr = positionId.toString();
            const candidateIdStr = (index + 1).toString();
            
            if (!acc[positionIdStr]) {
              acc[positionIdStr] = {};
            }
            
            const voteCount = voteCountResults[index].status === 'success' 
              ? Number(voteCountResults[index].result)
              : 0;
            
            // Get the actual voters from the contract
            const voters = voterResults[index].status === 'success'
              ? voterResults[index].result
              : [];
              
            acc[positionIdStr][candidateIdStr] = {
              count: voteCount,
              voters: voters
            };
          }
        }
        return acc;
      }, {});

      // Update state and return processed counts
      setVoteCounts(prev => ({
        ...prev,
        [campaignId]: processedCounts
      }));

      return processedCounts;
    } catch (error) {
      console.error('Error fetching vote counts:', error);
      return {};
    }
  }, [publicClient]);

  // Return memoized vote counts getter
  const getVoteCounts = useCallback((campaignId: string, positionId: string) => {
    return voteCounts[campaignId]?.[positionId] || {};
  }, [voteCounts]);

  const getUserVotes = useCallback(async (campaignId: string, userAddress: string) => {
    if (!publicClient) return [];

    try {
      const votes = await publicClient.readContract({
        ...VOTING_CONTRACT_CONFIG,
        functionName: 'getUserVotes',
        args: [BigInt(campaignId), userAddress]
      }) as [bigint[], bigint[]];

      return votes[0].map((positionId, index) => ({
        positionId: positionId.toString(),
        candidateId: votes[1][index].toString()
      }));
    } catch (error) {
      console.error('Error fetching user votes:', error);
      return [];
    }
  }, [publicClient]);

  return {
    vote,
    voteBatch,
    getVoteCount,
    hasVoted,
    submitVote,
    getUserVotes,
    getVoteCounts,
    fetchVoteCounts,
    ...state
  }
}