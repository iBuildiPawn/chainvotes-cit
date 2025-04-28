'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useIsMounted } from '@/lib/hooks/useIsMounted';
import { Button } from '@/components/ui/Button';
import { getCampaignTimeInfo } from '@/lib/utils/date';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Position, Candidate } from '@/lib/types/campaign';
import PositionForm from '@/components/positions/PositionForm';
import CandidateForm from '@/components/candidates/CandidateForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Toast } from '@/components/ui/Toast';

export default function CampaignConfigPage() {
  const router = useRouter();
  const { id } = useParams();
  const { campaigns, isLoading: isCampaignsLoading, addPositions, addCandidatesBatch, refetch } = useCampaigns();
  const isMounted = useIsMounted();
  
  // Set the initial active tab based on whether positions exist
  const [activeTab, setActiveTab] = useState<'positions' | 'candidates'>('positions');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  // Convert id to string to ensure consistent comparison
  const campaignId = id ? (typeof id === 'string' ? id : String(id)) : '';
  
  // Find the campaign with exact string matching
  const campaign = campaigns.find(c => String(c.id) === campaignId);
  
  // Enhanced debug logging
  useEffect(() => {
    if (campaign) {
      console.log('Campaign data loaded:', {
        id: campaign.id,
        title: campaign.title,
        positionsCount: campaign.positions.length,
        candidatesCount: campaign.candidates.length
      });
      
      if (campaign.positions.length > 0) {
        console.log('Positions found:', campaign.positions.map(p => ({
          id: p.id,
          name: p.name,
          exists: p.exists
        })));
      } else {
        console.warn('No positions found for campaign:', campaign.id);
      }
    } else {
      console.warn('Campaign not found with ID:', campaignId);
    }
  }, [campaign, campaignId]);
  
  // Set the active tab based on whether positions exist
  useEffect(() => {
    if (campaign && campaign.positions.length > 0) {
      console.log(`Campaign ${campaignId} has ${campaign.positions.length} positions. Switching to candidates tab.`);
      setActiveTab('candidates');
    } else if (campaign) {
      console.log(`Campaign ${campaignId} has no positions. Staying on positions tab.`);
      console.log('Campaign data:', campaign);
    }
  }, [campaign, campaignId]);
  
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  if (!isMounted) return null;
  
  // Show loading state while campaigns are being fetched
  if (isCampaignsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Loading Campaign</h2>
          <p className="mt-2 text-gray-600">
            We're retrieving campaign information from the blockchain. This may take a few moments...
          </p>
        </div>
      </div>
    );
  }
  
  // Only show "Campaign not found" after we've confirmed campaigns are loaded
  if (!campaign && !isCampaignsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-6 flex justify-center">
            <svg className="h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Campaign not found</h2>
          <p className="mt-2 text-gray-600 mb-6">
            The campaign you're looking for doesn't exist or may have been removed.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Continue with the rest of the component if campaign is found
  if (campaign) {
    const { status } = getCampaignTimeInfo(campaign.startDate, campaign.endDate);
    
    // Redirect if campaign has already started
    if (status !== 'upcoming') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="mb-6 flex justify-center">
              <svg className="h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Campaign has already started</h2>
            <p className="mt-2 text-gray-600 mb-6">
              This campaign has already started and cannot be configured anymore.
            </p>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => router.push(`/campaigns/${id}/vote`)}
                className="px-6 py-2"
              >
                Go to Voting Page
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2"
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    const handlePositionsSubmit = async (data: Omit<Position, 'id' | 'exists'>[]) => {
      if (!id) {
        setError('Campaign ID is missing');
        return;
      }
      
      try {
        setIsLoading(true);
        setLoadingMessage('Adding positions... Please confirm the transaction in your wallet');
        setError(null);
        
        await addPositions(id as string, data);
        
        setToast({
          show: true,
          message: 'Positions added successfully!',
          type: 'success'
        });
        
        // Refresh campaign data
        await refetch();
        
        // Switch to candidates tab if there are positions
        if (data.length > 0) {
          setActiveTab('candidates');
        }
        
        setIsLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setToast({
          show: true,
          message: error instanceof Error ? error.message : 'Failed to add positions',
          type: 'error'
        });
        setIsLoading(false);
      }
    };
    
    const handleCandidatesSubmit = async (data: Omit<Candidate, 'id' | 'exists'>[]) => {
      if (!id) {
        setError('Campaign ID is missing');
        return;
      }
      
      try {
        setIsLoading(true);
        setLoadingMessage('Adding candidates... Please confirm the transaction in your wallet');
        setError(null);
        
        await addCandidatesBatch(id as string, data);
        
        setToast({
          show: true,
          message: 'Candidates added successfully!',
          type: 'success'
        });
        
        // Refresh campaign data
        await refetch();
        
        setIsLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setToast({
          show: true,
          message: error instanceof Error ? error.message : 'Failed to add candidates',
          type: 'error'
        });
        setIsLoading(false);
      }
    };
    
    const handleManualOverride = () => {
      setIsLoading(false);
    };
    
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Configure Campaign</h1>
              <p className="mt-2 text-lg text-gray-600">
                {campaign.title}
              </p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Campaign starts on {campaign.startDate.toLocaleDateString()}
                </p>
                <Button 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      setLoadingMessage('Refreshing campaign data...');
                      await refetch();
                      setToast({
                        show: true,
                        message: 'Campaign data refreshed successfully!',
                        type: 'success'
                      });
                    } catch (error) {
                      setToast({
                        show: true,
                        message: 'Failed to refresh campaign data',
                        type: 'error'
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'positions' | 'candidates')}>
              <TabsList className="mb-6">
                <TabsTrigger value="positions">Add Positions</TabsTrigger>
                <TabsTrigger value="candidates" disabled={campaign.positions.length === 0}>
                  Add Candidates
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="positions">
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Add Positions</h2>
                  <p className="text-gray-600 mb-6">
                    Add the positions that candidates can run for in this campaign.
                  </p>
                  
                  {campaign.positions.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                      <h3 className="text-md font-medium mb-2">Current Positions</h3>
                      <ul className="space-y-2">
                        {campaign.positions.map((position) => (
                          <li key={position.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                            <span>{position.name}</span>
                            <span className="text-sm text-gray-500">
                              {campaign.candidates.filter(c => c.positionId === position.id).length} candidates
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {campaign.positions.length === 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <h3 className="text-md font-medium text-yellow-800 mb-2">No Positions Found</h3>
                      <p className="text-sm text-yellow-700">
                        If you've already added positions but they're not showing up, try refreshing the data using the button above.
                      </p>
                      <details className="mt-2">
                        <summary className="text-sm text-yellow-700 cursor-pointer">Debug Information</summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                          <p>Campaign ID: {campaign.id}</p>
                          <p>Position Count: {campaign.positions.length}</p>
                          <p>Raw Campaign Data: {JSON.stringify(campaign, null, 2)}</p>
                          <div className="mt-2">
                            <a 
                              href="/debug" 
                              target="_blank" 
                              className="text-blue-600 hover:underline"
                            >
                              Open Debug Page
                            </a>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                  
                  <PositionForm 
                    campaignId={id as string} 
                    onSubmit={handlePositionsSubmit} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="candidates">
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Add Candidates</h2>
                  <p className="text-gray-600 mb-6">
                    Add candidates for the positions in this campaign.
                  </p>
                  
                  {campaign.candidates.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                      <h3 className="text-md font-medium mb-2">Current Candidates</h3>
                      <ul className="space-y-2">
                        {campaign.candidates.map((candidate) => {
                          const position = campaign.positions.find(p => p.id === candidate.positionId);
                          return (
                            <li key={candidate.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                              <span>{candidate.name}</span>
                              <span className="text-sm text-gray-500">
                                {position?.name || 'Unknown position'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {campaign.positions.length > 0 ? (
                    <>
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="text-md font-medium text-blue-800 mb-2">Available Positions</h3>
                        <ul className="space-y-1">
                          {campaign.positions.map((position) => (
                            <li key={position.id} className="text-sm text-blue-700">
                              {position.name} (ID: {position.id})
                            </li>
                          ))}
                        </ul>
                      </div>
                      <CandidateForm 
                        campaignId={id as string}
                        onSubmit={handleCandidatesSubmit} 
                        positions={campaign.positions}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        You need to add positions before you can add candidates.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('positions')}
                        className="mt-4"
                      >
                        Add Positions
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 flex justify-between">
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              
              <Button 
                onClick={() => router.push(`/campaigns/${id}/vote`)}
              >
                Go to Campaign
              </Button>
            </div>
          </div>
        </main>
        
        {isLoading && (
          <LoadingOverlay 
            message={loadingMessage}
            onManualOverride={handleManualOverride}
            showManualOverride={true}
          />
        )}
        
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    );
  }
  
  return null;
} 