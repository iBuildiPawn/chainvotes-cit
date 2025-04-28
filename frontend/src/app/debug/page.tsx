'use client';

import { useState, useEffect } from 'react';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { usePublicClient } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/lib/contracts/voting';

export default function DebugPage() {
  const { campaigns, isLoading } = useCampaigns();
  const [directPositions, setDirectPositions] = useState<any[]>([]);
  const [directLoading, setDirectLoading] = useState(true);
  const [directError, setDirectError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  // Directly fetch positions from the contract
  useEffect(() => {
    async function fetchPositionsDirectly() {
      if (!publicClient) return;
      
      setDirectLoading(true);
      setDirectError(null);
      
      try {
        console.log('Fetching positions directly from contract...');
        
        // Get the next campaign ID to know how many campaigns exist
        const nextCampaignId = await publicClient.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: VOTING_CONTRACT_ABI,
          functionName: 'nextCampaignId'
        }) as bigint;
        
        console.log('Next campaign ID:', nextCampaignId.toString());
        
        const results = [];
        
        // Loop through all campaigns
        for (let campaignId = 1n; campaignId < nextCampaignId; campaignId++) {
          try {
            // Get campaign info
            const campaignInfo = await publicClient.readContract({
              address: VOTING_CONTRACT_ADDRESS,
              abi: VOTING_CONTRACT_ABI,
              functionName: 'getCampaignInfo',
              args: [campaignId]
            }) as [string, string, bigint, bigint, boolean, bigint, bigint];
            
            const [title, , , , , positionCount] = campaignInfo;
            
            const campaignPositions = [];
            
            // Fetch all positions for this campaign
            for (let posId = 1n; posId <= positionCount; posId++) {
              try {
                const position = await publicClient.readContract({
                  address: VOTING_CONTRACT_ADDRESS,
                  abi: VOTING_CONTRACT_ABI,
                  functionName: 'getPosition',
                  args: [campaignId, posId]
                }) as [string, string, boolean];
                
                if (position[2]) { // if exists
                  campaignPositions.push({
                    id: posId.toString(),
                    name: position[0],
                    description: position[1],
                    exists: position[2]
                  });
                }
              } catch (err) {
                console.error(`Error fetching position ${posId} for campaign ${campaignId}:`, err);
              }
            }
            
            results.push({
              campaignId: campaignId.toString(),
              title,
              positionCount: positionCount.toString(),
              positions: campaignPositions
            });
          } catch (err) {
            console.error(`Error fetching campaign ${campaignId}:`, err);
          }
        }
        
        setDirectPositions(results);
      } catch (err) {
        console.error('Error in direct fetch:', err);
        setDirectError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setDirectLoading(false);
      }
    }
    
    fetchPositionsDirectly();
  }, [publicClient]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blockchain Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">RPC Configuration</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Primary RPC URL:</strong> {process.env.NEXT_PUBLIC_RPC_URL || 'Not set'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Positions from useCampaigns Hook</h2>
          {isLoading ? (
            <p>Loading campaigns...</p>
          ) : (
            <div>
              {campaigns.map(campaign => (
                <div key={campaign.id} className="mb-4 border p-4 rounded">
                  <h3 className="font-medium">{campaign.title} (ID: {campaign.id})</h3>
                  <p className="text-sm text-gray-500 mb-2">Position count: {campaign.positions.length}</p>
                  
                  {campaign.positions.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {campaign.positions.map(position => (
                        <li key={position.id}>
                          {position.name} (ID: {position.id})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-gray-500">No positions found</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Positions Fetched Directly</h2>
          {directLoading ? (
            <p>Loading positions directly...</p>
          ) : directError ? (
            <p className="text-red-500">Error: {directError}</p>
          ) : (
            <div>
              {directPositions.map(campaign => (
                <div key={campaign.campaignId} className="mb-4 border p-4 rounded">
                  <h3 className="font-medium">{campaign.title} (ID: {campaign.campaignId})</h3>
                  <p className="text-sm text-gray-500 mb-2">Position count: {campaign.positionCount}</p>
                  
                  {campaign.positions.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {campaign.positions.map((position: any) => (
                        <li key={position.id}>
                          {position.name} (ID: {position.id})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-gray-500">No positions found</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 