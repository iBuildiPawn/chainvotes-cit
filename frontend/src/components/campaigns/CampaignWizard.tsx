'use client';

import { useState, useEffect } from 'react';
import { Campaign, Position, Candidate } from '@/lib/types/campaign';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import CampaignForm from '@/components/campaigns/CampaignForm';
import PositionForm from '@/components/positions/PositionForm';
import CandidateForm from '@/components/candidates/CandidateForm';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCampaigns } from '@/lib/hooks/useCampaigns';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  completedSteps: Record<number, boolean>;
  onStepClick: (step: number) => void;
  disableNavigation?: boolean;
}

function StepIndicator({ 
  currentStep, 
  steps, 
  completedSteps, 
  onStepClick, 
  disableNavigation = false 
}: StepIndicatorProps) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <nav className="flex justify-center" aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, index) => (
            <li key={step} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {completedSteps[index] ? (
                <div className="group">
                  <span className="flex items-center">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 group-hover:bg-primary-800">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                    {index !== steps.length - 1 && (
                      <span className="absolute left-8 top-4 -ml-px h-0.5 w-8 sm:w-20 bg-primary-600" aria-hidden="true" />
                    )}
                  </span>
                  <button
                    onClick={() => !disableNavigation && onStepClick(index)}
                    className="mt-3 block text-xs font-medium text-foreground"
                    disabled={disableNavigation}
                  >
                    {step}
                  </button>
                </div>
              ) : index === currentStep ? (
                <div className="group" aria-current="step">
                  <span className="flex items-center">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-600 bg-background">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                    </span>
                    {index !== steps.length - 1 && (
                      <span className="absolute left-8 top-4 -ml-px h-0.5 w-8 sm:w-20 bg-border" aria-hidden="true" />
                    )}
                  </span>
                  <button
                    className="mt-3 block text-xs font-medium text-primary-600"
                    disabled
                  >
                    {step}
                  </button>
                </div>
              ) : (
                <div className="group">
                  <span className="flex items-center">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background group-hover:border-gray-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                    </span>
                    {index !== steps.length - 1 && (
                      <span className="absolute left-8 top-4 -ml-px h-0.5 w-8 sm:w-20 bg-border" aria-hidden="true" />
                    )}
                  </span>
                  <button
                    onClick={() => !disableNavigation && completedSteps[index - 1] && onStepClick(index)}
                    className={`mt-3 block text-xs font-medium ${completedSteps[index - 1] && !disableNavigation ? 'text-muted-foreground group-hover:text-foreground cursor-pointer' : 'text-muted-foreground/50 cursor-not-allowed'}`}
                    disabled={!completedSteps[index - 1] || disableNavigation}
                  >
                    {step}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

interface CampaignWizardProps {
  onComplete?: (campaign: Campaign) => void;
}

export default function CampaignWizard({ onComplete }: CampaignWizardProps) {
  const router = useRouter();
  const { addCampaign, addPositions, addCandidatesBatch, campaigns, refetch } = useCampaigns();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  
  const [campaignData, setCampaignData] = useState<Omit<Campaign, 'id' | 'positions' | 'candidates' | 'status' | 'isActive'> | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Omit<Position, 'id' | 'exists'>[]>([]);
  const [candidates, setCandidates] = useState<Omit<Candidate, 'id' | 'exists'>[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [createTxHash, setCreateTxHash] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const maxPollingAttempts = 10; // Maximum number of attempts to find the campaign
  
  const steps = ['Campaign Details', 'Add Positions', 'Add Candidates', 'Review & Launch'];
  
  // Get current campaign data for candidates step
  const currentCampaign = campaignId ? campaigns.find(c => c.id === campaignId) : null;

  useEffect(() => {
    // If we have a transaction hash but no campaign ID yet, keep checking for the campaign
    if (createTxHash && !campaignId) {
      const checkForNewCampaign = async () => {
        try {
          if (pollingAttempts >= maxPollingAttempts) {
            setError('Could not automatically detect the newly created campaign. Please use the manual override button below to continue.');
            setIsLoading(false);
            // Don't reset the transaction hash so user knows there was a transaction
            return;
          }
          
          setPollingAttempts(prev => prev + 1);
          setLoadingMessage(`Waiting for blockchain confirmation... (Attempt ${pollingAttempts + 1}/${maxPollingAttempts})`);
          
          // Force refresh campaigns data
          await refetch();
          
          // Sort campaigns by ID descending to get the latest one
          const sortedCampaigns = [...campaigns].sort((a, b) => Number(b.id) - Number(a.id));
          
          if (sortedCampaigns.length > 0) {
            const newCampaign = sortedCampaigns[0];
            console.log('Found new campaign:', newCampaign);
            
            // Check if this is actually a new campaign by comparing timestamps
            // Only proceed if the campaign was created recently (within last 5 minutes)
            const campaignTimestamp = new Date(newCampaign.startDate).getTime();
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            
            if (campaignTimestamp > fiveMinutesAgo) {
              setCampaignId(newCampaign.id);
              setCompletedSteps(prev => ({ ...prev, 0: true }));
              setCurrentStep(1);
              setCreateTxHash(null); // Reset hash since we found the campaign
              setPollingAttempts(0);
              setIsLoading(false); // Ensure loading overlay is dismissed
              return; // Exit the polling loop
            } else {
              console.log('Found campaign but it appears to be old:', newCampaign);
              // Continue polling as this might be an old campaign
            }
          }
          
          // If we still don't have the campaign, try again in a moment
          setTimeout(checkForNewCampaign, 3000); // Increase delay between attempts
        } catch (err) {
          console.error("Error checking for new campaign:", err);
          // Still retry on error
          setTimeout(checkForNewCampaign, 3000);
        }
      };
      
      // Start checking for the new campaign
      checkForNewCampaign();
      
      // Safety timeout - dismiss loading overlay after 30 seconds regardless
      const safetyTimeout = setTimeout(() => {
        if (isLoading && createTxHash) {
          console.log('Safety timeout reached - dismissing loading overlay');
          setIsLoading(false);
          setError('Transaction confirmed, but campaign detection is taking longer than expected. Please use the manual override button below to continue setup.');
        }
      }, 30000); // 30 seconds
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [createTxHash, campaignId, campaigns, refetch, pollingAttempts, isLoading]);
  
  const handleCampaignSubmit = async (data: Omit<Campaign, 'id' | 'positions' | 'candidates' | 'status' | 'isActive'>) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Creating campaign... Please confirm the transaction in your wallet');
      setError(null);
      setTransactionStatus('pending');
      
      setCampaignData(data);
      const receipt = await addCampaign(data).catch((error: Error) => {
        if (error.message.includes('canceled')) {
          setTransactionStatus('idle');
          throw new Error('Transaction canceled. No campaign was created.');
        }
        throw error;
      });
      
      if (!receipt) {
        setTransactionStatus('error');
        throw new Error('Transaction failed or was canceled. No campaign was created.');
      }
      
      setTransactionStatus('success');
      
      // Check if we got a campaign ID directly from the receipt
      if ('campaignId' in receipt) {
        console.log('Campaign ID found in receipt:', receipt.campaignId);
        setCampaignId(receipt.campaignId);
        setCompletedSteps(prev => ({ ...prev, 0: true }));
        setCurrentStep(1);
        setIsLoading(false);
        return; // Exit early since we have the campaign ID
      }
      
      // Store the transaction hash to track the new campaign
      setCreateTxHash(receipt.hash);
      console.log('Campaign creation transaction hash:', receipt.hash);
      
      // Reset polling attempts
      setPollingAttempts(0);
      
      // Show loading message while we wait for campaign to be found
      setLoadingMessage('Waiting for blockchain confirmation... This may take a minute.');
      
      // Force a refresh of campaigns immediately and after a short delay
      try {
        console.log('Immediate campaign refresh...');
        await refetch();
        
        // Check if we can find the campaign immediately
        const sortedCampaigns = [...campaigns].sort((a, b) => Number(b.id) - Number(a.id));
        if (sortedCampaigns.length > 0) {
          const newCampaign = sortedCampaigns[0];
          console.log('Found campaign after immediate refresh:', newCampaign);
          setCampaignId(newCampaign.id);
          setCompletedSteps(prev => ({ ...prev, 0: true }));
          setCurrentStep(1);
          setCreateTxHash(null);
          setPollingAttempts(0);
          setIsLoading(false);
          return; // Exit early if we found the campaign
        }
      } catch (err) {
        console.error('Error during immediate refresh:', err);
        // Continue with polling if immediate refresh fails
      }
      
    } catch (error) {
      setTransactionStatus('error');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };
  
  const handlePositionsSubmit = async (data: Omit<Position, 'id' | 'exists'>[]) => {
    if (!campaignId) {
      setError('Campaign ID is missing');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingMessage(`Adding ${data.length} positions... Please confirm the transaction in your wallet`);
      setError(null);
      setTransactionStatus('pending');
      
      setPositions(data);
      await addPositions(campaignId, data).catch((error: Error) => {
        if (error.message.includes('canceled')) {
          setTransactionStatus('idle');
          throw new Error('Transaction canceled. No positions were added.');
        }
        throw error;
      });
      
      // Wait for the blockchain to update
      setLoadingMessage('Waiting for blockchain confirmation...');
      await refetch();
      
      setTransactionStatus('success');
      setCompletedSteps(prev => ({ ...prev, 1: true }));
      setCurrentStep(2);
    } catch (error) {
      setTransactionStatus('error');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCandidatesSubmit = async (data: Omit<Candidate, 'id' | 'exists'>[]) => {
    if (!campaignId) {
      setError('Campaign ID is missing');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingMessage(`Registering ${data.length} candidates... Please confirm the transaction in your wallet`);
      setError(null);
      setTransactionStatus('pending');
      
      setCandidates(data);
      await addCandidatesBatch(campaignId, data).catch((error: Error) => {
        if (error.message.includes('canceled')) {
          setTransactionStatus('idle');
          throw new Error('Transaction canceled. No candidates were added.');
        }
        throw error;
      });
      
      // Wait for the blockchain to update
      await refetch();
      
      setTransactionStatus('success');
      setCompletedSteps(prev => ({ ...prev, 2: true }));
      setCurrentStep(3);
    } catch (error) {
      setTransactionStatus('error');
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFinish = () => {
    setCompletedSteps(prev => ({ ...prev, 3: true }));
    router.push(`/campaigns/${campaignId}/vote`);
  };
  
  const handleStepClick = (step: number) => {
    // Only allow navigation to completed steps or next step
    if (completedSteps[step] || step === currentStep) {
      setCurrentStep(step);
    }
  };
  
  const handleManualOverride = () => {
    // Find the most recent campaign
    const sortedCampaigns = [...campaigns].sort((a, b) => Number(b.id) - Number(a.id));
    
    if (sortedCampaigns.length > 0) {
      const newCampaign = sortedCampaigns[0];
      console.log('Manual override - using campaign:', newCampaign);
      setCampaignId(newCampaign.id);
      setCompletedSteps(prev => ({ ...prev, 0: true }));
      setCurrentStep(1);
      setCreateTxHash(null);
      setPollingAttempts(0);
      setError(null);
    } else {
      setError('No campaigns found. Please try creating a campaign again or refresh the page.');
    }
  };
  
  return (
    <div className="min-h-[60vh] flex flex-col">
      {isLoading && (
        <LoadingOverlay 
          isLoading={true} 
          message={loadingMessage} 
          onManualOverride={handleManualOverride}
        />
      )}
      
      <StepIndicator 
        currentStep={currentStep} 
        steps={steps} 
        completedSteps={completedSteps} 
        onStepClick={handleStepClick}
        disableNavigation={isLoading}
      />
      
      {error && (
        <div className="my-4 p-4 bg-error/10 border border-error/20 rounded-md flex items-start">
          <div className="flex-shrink-0 mr-3 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-error font-medium">{error}</p>
            {createTxHash && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Your campaign was likely created successfully, but we couldn't detect it automatically.
                </p>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleManualOverride} 
                    className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
                  >
                    Continue with Latest Campaign
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
            {transactionStatus === 'error' && !createTxHash && (
              <p className="text-sm text-muted-foreground mt-1">
                Please try again or contact support if the issue persists.
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1">
        {currentStep === 0 && (
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <CampaignForm 
              onSubmit={handleCampaignSubmit} 
              onCancel={() => router.back()}
              isSubmitting={isLoading}
            />
          </div>
        )}
        
        {currentStep === 1 && (
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <PositionForm
              campaignId={campaignId || ''}
              onSubmit={handlePositionsSubmit}
              onCancel={() => setCurrentStep(0)}
            />
          </div>
        )}
        
        {currentStep === 2 && currentCampaign && (
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <CandidateForm
              positions={currentCampaign.positions}
              onSubmit={handleCandidatesSubmit}
              onCancel={() => setCurrentStep(1)}
            />
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="bg-card shadow-sm border border-border rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground">Campaign Setup Complete!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your campaign has been successfully created with {positions.length} positions and {candidates.length} candidates.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="border border-border rounded-md p-4">
                  <h4 className="font-medium text-foreground">Campaign Details</h4>
                  {campaignData && (
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Title</dt>
                        <dd className="text-sm text-foreground">{campaignData.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Organization</dt>
                        <dd className="text-sm text-foreground">{campaignData.organizationName}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Start Date</dt>
                        <dd className="text-sm text-foreground">{campaignData.startDate.toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">End Date</dt>
                        <dd className="text-sm text-foreground">{campaignData.endDate.toLocaleDateString()}</dd>
                      </div>
                    </dl>
                  )}
                </div>
                
                <div className="border border-border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-foreground">Positions</h4>
                    <span className="bg-primary-500/10 text-primary-500 text-xs font-medium px-2.5 py-0.5 rounded">
                      {positions.length} positions
                    </span>
                  </div>
                  <ul className="mt-2 divide-y divide-border">
                    {positions.map((position, index) => (
                      <li key={index} className="py-2">
                        <p className="text-sm font-medium text-foreground">{position.name}</p>
                        <p className="text-xs text-muted-foreground">{position.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="border border-border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-foreground">Candidates</h4>
                    <span className="bg-primary-500/10 text-primary-500 text-xs font-medium px-2.5 py-0.5 rounded">
                      {candidates.length} candidates
                    </span>
                  </div>
                  <ul className="mt-2 divide-y divide-border">
                    {candidates.map((candidate, index) => {
                      const position = positions.find(p => {
                        // Find matching position for this candidate based on the current campaign
                        const campaignPosition = currentCampaign?.positions.find(cp => cp.id === candidate.positionId);
                        return campaignPosition && campaignPosition.name === p.name;
                      });
                      
                      return (
                        <li key={index} className="py-2">
                          <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{position?.name || 'Unknown Position'}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}