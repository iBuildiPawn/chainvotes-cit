'use client';
import { useState, useCallback, useEffect } from 'react';
import { Campaign, Position, Candidate } from '@/lib/types/campaign';
import { usePublicClient, useWalletClient, useChainId, useAccount } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '../contracts/voting';
import { sepolia } from 'viem/chains';
import { assertSepolia, NetworkError } from '../utils/network';
import { ContractFunctionExecutionError } from 'viem';
import { TransactionReceipt } from 'viem';
import { decodeEventLog } from 'viem';

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'City Council Election 2024',
    description: 'Annual city council election for selecting new council members.',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-15'),
    organizationName: 'City Electoral Commission',
    status: 'draft',
    positions: [],
    candidates: []
  },
  {
    id: '2',
    title: 'State Governor Election',
    description: 'State gubernatorial election for the term 2024-2028.',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-08-15'),
    organizationName: 'State Electoral Board',
    status: 'active',
    positions: [],
    candidates: []
  }
];

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { address } = useAccount();

  const checkNetwork = useCallback(() => {
    try {
      assertSepolia(chainId);
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(err.message);
      }
      throw err;
    }
  }, [chainId]);

  const handleContractError = (err: any) => {
    const errorMessage = err.message || 'Contract interaction failed';
    
    // Handle user rejection cases
    if (
      errorMessage.includes('User rejected the request') ||
      errorMessage.includes('user rejected transaction') ||
      errorMessage.includes('User denied transaction') ||
      errorMessage.includes('Transaction was rejected')
    ) {
      throw new Error('Transaction canceled by user');
    }
    
    if (errorMessage.includes('Campaign does not exist')) {
      throw new Error('Campaign not found');
    }
    if (errorMessage.includes('not owner')) {
      throw new Error('Only the contract owner can perform this action');
    }
    if (errorMessage.includes('execution reverted')) {
      throw new Error('Transaction failed. Please check your inputs and try again.');
    }
    throw err;
  };

  const fetchCampaigns = useCallback(async () => {
    if (!publicClient) {
      console.log('No public client available');
      setLoading(false);
      return;
    }
    
    try {
      checkNetwork();
      if (!isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      console.log('Fetching next campaign ID...');
      
      let nextCampaignId: bigint;
      try {
        nextCampaignId = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'nextCampaignId'
        }) as bigint;
        console.log('Next campaign ID:', nextCampaignId.toString());
      } catch (err) {
        console.error('Error fetching nextCampaignId:', err);
        if (err instanceof ContractFunctionExecutionError) {
          setError('Contract read failed. The contract may have been redeployed.');
          setLoading(false);
          return;
        }
        throw err;
      }

      const fetchedCampaigns: Campaign[] = [];

      // Fetch all campaigns (skip ID 0 as it's not used)
      for (let id = 1n; id < nextCampaignId; id++) {
        try {
          console.log(`Fetching campaign ${id.toString()}...`);
          const campaignInfo = await publicClient.readContract({
            address: VOTING_CONTRACT_ADDRESS,
            abi: VOTING_CONTRACT_ABI,
            functionName: 'getCampaignInfo',
            args: [id]
          }) as [string, string, bigint, bigint, boolean, bigint, bigint];

          // Add debug logging
          console.log('Campaign info received:', {
            id: id.toString(),
            title: campaignInfo[0],
            description: campaignInfo[1],
            startTime: campaignInfo[2].toString(),
            endTime: campaignInfo[3].toString(),
            isActive: campaignInfo[4],
            positionCount: campaignInfo[5].toString(),
            candidateCount: campaignInfo[6].toString()
          });

          const [title, description, startTime, endTime, isActive, positionCount, candidateCount] = campaignInfo;

          // Create campaign object
          const campaign: Campaign = {
            id: id.toString(),
            title,
            description,
            startDate: new Date(Number(startTime) * 1000),
            endDate: new Date(Number(endTime) * 1000),
            organizationName: 'Blockchain Voting System',
            status: isActive ? 'active' : 'ended',
            positions: [],
            candidates: [],
          };

          // Fetch positions if any
          if (positionCount > 0n) {
            console.log(`Campaign ${id.toString()} has ${positionCount.toString()} positions. Fetching...`);
            for (let posId = 1n; posId <= positionCount; posId++) {
              try {
                console.log(`Fetching position ${posId.toString()} for campaign ${id.toString()}...`);
                const position = await publicClient.readContract({
                  address: VOTING_CONTRACT_ADDRESS,
                  abi: VOTING_CONTRACT_ABI,
                  functionName: 'getPosition',
                  args: [id, posId]
                }) as [string, string, boolean];

                console.log(`Position ${posId.toString()} data:`, {
                  name: position[0],
                  description: position[1],
                  exists: position[2]
                });

                if (position[2]) { // if exists
                  campaign.positions.push({
                    id: posId.toString(),
                    name: position[0],
                    description: position[1],
                    exists: position[2]
                  });
                }
              } catch (err) {
                console.error(`Error fetching position ${posId} for campaign ${id}:`, err);
              }
            }
            console.log(`Finished fetching positions for campaign ${id.toString()}. Found ${campaign.positions.length} valid positions.`);
          } else {
            console.log(`Campaign ${id.toString()} has no positions (positionCount: ${positionCount.toString()}).`);
          }

          // Fetch candidates if any
          if (candidateCount > 0n) {
            for (let candId = 1n; candId <= candidateCount; candId++) {
              try {
                const candidate = await publicClient.readContract({
                  address: VOTING_CONTRACT_ADDRESS,
                  abi: VOTING_CONTRACT_ABI,
                  functionName: 'getCandidate',
                  args: [id, candId]
                }) as [string, string, bigint, boolean];

                if (candidate[3]) { // if exists
                  let metadata = {};
                  try {
                    metadata = JSON.parse(candidate[1]);
                  } catch (e) {
                    console.warn(`Invalid metadata for candidate ${candId} in campaign ${id}`);
                  }

                  campaign.candidates.push({
                    id: candId.toString(),
                    name: candidate[0],
                    positionId: candidate[2].toString(),
                    bio: (metadata as any).bio || '',
                    imageUrl: (metadata as any).imageUrl,
                    metadata: candidate[1],
                    exists: candidate[3]
                  });
                }
              } catch (err) {
                console.error(`Error fetching candidate ${candId} for campaign ${id}:`, err);
              }
            }
          }

          fetchedCampaigns.push(campaign);
        } catch (err) {
          console.error(`Error fetching campaign ${id}:`, err);
          // Continue with next campaign instead of breaking the loop
          continue;
        }
      }

      setCampaigns(fetchedCampaigns);
      setIsInitialLoad(false);
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        console.error('Error in fetchCampaigns:', err);
        setError('Failed to fetch campaigns. Please check your network connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [publicClient, checkNetwork, isInitialLoad]);

  // Enhanced refetch function with forced refresh
  const refetch = useCallback(async (forceRefresh = true) => {
    console.log('Manually refetching campaign data...');
    setIsInitialLoad(false);
    
    // Clear the current campaigns to force a complete refresh
    if (forceRefresh) {
      setCampaigns([]);
    }
    
    return fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const addPosition = useCallback(async (campaignId: string, position: Omit<Position, 'id' | 'exists'>) => {
    if (!walletClient || !address) throw new Error('Wallet not connected');

    try {
      checkNetwork();

      const hash = await walletClient.writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'addPosition',
        args: [BigInt(campaignId), position.name, position.description]
      }).catch(handleContractError);

      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchCampaigns();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Cannot add positions after campaign has started')) {
        throw new Error('Positions can only be added before the campaign starts');
      }
      throw err;
    }
  }, [publicClient, walletClient, address, fetchCampaigns, checkNetwork]);

  const addPositions = useCallback(async (campaignId: string, positions: Omit<Position, 'id' | 'exists'>[]) => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    try {
      checkNetwork();
      
      console.log(`Adding ${positions.length} positions to campaign ${campaignId}:`, positions);
      
      // Format positions as struct array
      const positionInputs = positions.map(p => ({
        name: p.name,
        description: p.description
      }));
      
      console.log('Formatted position inputs:', positionInputs);
      console.log('Contract address:', VOTING_CONTRACT_ADDRESS);
      
      // Estimate gas for the transaction
      let gasEstimate: bigint;
      try {
        gasEstimate = await publicClient!.estimateContractGas({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'addPositions',
          args: [BigInt(campaignId), positionInputs],
          account: address
        });
        console.log(`Estimated gas for adding ${positions.length} positions:`, gasEstimate.toString());
      } catch (err) {
        console.error('Gas estimation error:', err);
        // Continue without gas estimate
      }
      
      console.log('Sending transaction to add positions...');
      const hash = await walletClient.writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'addPositions',
        args: [BigInt(campaignId), positionInputs],
      }).catch(handleContractError);
      
      console.log('Transaction hash:', hash);
      
      try {
        console.log('Waiting for transaction receipt...');
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });
        console.log('Transaction receipt received:', receipt);
        
        console.log('Refreshing campaign data...');
        await fetchCampaigns();
        console.log('Campaign data refreshed');
      } catch (err) {
        if (err instanceof Error) {
          console.error('Transaction receipt error:', err);
          if (err.message.includes('transaction failed')) {
            throw new Error('Transaction failed on the blockchain. Please try again with fewer positions or contact support.');
          } else {
            // Other transaction receipt errors
            throw new Error('Transaction failed. Please check your network connection and try again.');
          }
        }
        throw err;
      }
    } catch (err) {
      console.error('Error in addPositions:', err);
      if (err instanceof Error) {
        if (err.message.includes('Cannot add positions after campaign has started')) {
          throw new Error('Positions can only be added before the campaign starts');
        } else if (err.message.includes('Transaction canceled by user')) {
          throw new Error('Transaction was canceled. No positions were added.');
        } else if (err.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds to complete this transaction. Please add more ETH to your wallet.');
        }
      }
      throw err;
    }
  }, [publicClient, walletClient, address, fetchCampaigns, checkNetwork]);

  const addCandidate = useCallback(async (campaignId: string, candidate: Omit<Candidate, 'id' | 'exists'>) => {
    if (!walletClient) throw new Error('Wallet not connected');

    try {
      checkNetwork();

      const metadata = JSON.stringify({
        bio: candidate.bio,
        imageUrl: candidate.imageUrl
      });

      const hash = await walletClient.writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'registerCandidate',
        args: [BigInt(campaignId), BigInt(candidate.positionId), candidate.name, metadata]
      }).catch(handleContractError);

      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchCampaigns();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Position does not exist')) {
        throw new Error('The selected position does not exist in this campaign');
      }
      throw err;
    }
  }, [publicClient, walletClient, fetchCampaigns, checkNetwork]);

  const addCandidatesBatch = useCallback(async (campaignId: string, candidates: Omit<Candidate, 'id' | 'exists'>[]) => {
    if (!walletClient) throw new Error('Wallet not connected');

    try {
      checkNetwork();

      const candidateInputs = candidates.map(candidate => ({
        positionId: BigInt(candidate.positionId),
        name: candidate.name,
        metadata: JSON.stringify({
          bio: candidate.bio,
          imageUrl: candidate.imageUrl
        })
      }));

      const hash = await walletClient.writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'registerCandidatesBatch',
        args: [BigInt(campaignId), candidateInputs]
      }).catch(handleContractError);

      await publicClient?.waitForTransactionReceipt({ hash });
      await fetchCampaigns();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Position does not exist')) {
          throw new Error('One or more selected positions do not exist in this campaign');
        }
        if (err.message.includes('execution reverted')) {
          throw new Error('Failed to register candidates. Please check that all positions exist and try again.');
        }
      }
      throw err;
    }
  }, [publicClient, walletClient, fetchCampaigns, checkNetwork]);

  const addCampaign = useCallback(async (campaign: Omit<Campaign, 'id' | 'positions' | 'candidates' | 'status' | 'isActive'>) => {
    if (!walletClient) throw new Error('Wallet not connected');
    
    try {
      console.log('Starting campaign creation with wallet:', await walletClient.account.address);
      checkNetwork();

      // Validate dates
      const now = Math.floor(Date.now() / 1000);
      const startTimestamp = Math.floor(campaign.startDate.getTime() / 1000);
      const endTimestamp = Math.floor(campaign.endDate.getTime() / 1000);

      console.log('Timestamps:', {
        now,
        startTimestamp,
        endTimestamp,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString()
      });

      if (startTimestamp <= now) {
        throw new Error('Campaign start time must be in the future');
      }

      if (endTimestamp <= startTimestamp) {
        throw new Error('Campaign end time must be after start time');
      }

      // Validate other required fields
      if (!campaign.title.trim()) {
        throw new Error('Campaign title is required');
      }

      if (!campaign.description.trim()) {
        throw new Error('Campaign description is required');
      }

      if (!campaign.organizationName.trim()) {
        throw new Error('Organization name is required');
      }

      console.log('Creating campaign with args:', {
        title: campaign.title,
        description: campaign.description,
        startTimestamp: BigInt(startTimestamp),
        endTimestamp: BigInt(endTimestamp),
        contractAddress: VOTING_CONTRACT_ADDRESS
      });

      // Prepare for transaction
      let hash;
      let receipt;
      
      try {
        // Send the transaction
        hash = await walletClient.writeContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'createCampaign',
          args: [campaign.title, campaign.description, BigInt(startTimestamp), BigInt(endTimestamp)]
        }).catch(handleContractError);
        
        console.log('Campaign creation transaction hash:', hash);
        
        // Wait for transaction receipt with a timeout
        const receiptPromise = publicClient?.waitForTransactionReceipt({ hash });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction receipt timeout')), 30000)
        );
        
        receipt = await Promise.race([receiptPromise, timeoutPromise]) as TransactionReceipt;
        console.log('Campaign creation receipt:', receipt);
        
        // Immediately try to get the campaign ID from logs
        let campaignId: string | null = null;
        
        try {
          // Try to extract campaign ID from transaction logs
          if (receipt?.logs && receipt.logs.length > 0) {
            // Find the CampaignCreated event log
            const campaignCreatedLog = receipt.logs.find(log => 
              log.address.toLowerCase() === VOTING_CONTRACT_ADDRESS.toLowerCase()
            );
            
            if (campaignCreatedLog) {
              // Parse the log data to extract campaign ID
              // This depends on the event structure in your contract
              console.log('Found potential campaign creation log:', campaignCreatedLog);
              
              // Attempt to decode the log
              try {
                const decodedLog = decodeEventLog({
                  abi: VOTING_CONTRACT_ABI,
                  data: campaignCreatedLog.data,
                  topics: campaignCreatedLog.topics,
                });
                
                console.log('Decoded log:', decodedLog);
                
                // Extract campaign ID if available
                if (decodedLog.eventName === 'CampaignCreated' && decodedLog.args) {
                  campaignId = decodedLog.args.campaignId?.toString() || null;
                  console.log('Extracted campaign ID from logs:', campaignId);
                }
              } catch (decodeError) {
                console.error('Error decoding log:', decodeError);
              }
            }
          }
        } catch (logError) {
          console.error('Error extracting campaign ID from logs:', logError);
        }
        
        // Refresh campaigns list
        await fetchCampaigns();
        
        // If we found a campaign ID from logs, return it with the receipt
        if (campaignId) {
          return { ...receipt, campaignId };
        }
        
        return receipt;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Transaction canceled by user')) {
            console.log('User canceled the transaction');
            throw new Error('Campaign creation was canceled. No campaign was created.');
          } else if (!hash) {
            // Transaction wasn't sent
            console.error('Failed to send transaction:', error);
            throw new Error('Failed to submit transaction. Please try again.');
          } else {
            // Transaction was sent but failed
            console.error('Contract execution error:', error);
            throw new Error('Transaction failed on the blockchain. Please try again or contact support.');
          }
        }
        throw error;
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  }, [publicClient, walletClient, fetchCampaigns, checkNetwork]);

  return {
    campaigns,
    isLoading: loading,
    error,
    addPosition,
    addPositions, // New batch function
    addCandidate,
    addCandidatesBatch,
    addCampaign,
    refetch
  };
}