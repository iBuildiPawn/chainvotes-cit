'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useIsMounted } from '@/lib/hooks/useIsMounted';
import { Button } from '@/components/ui/Button';
import { getCampaignTimeInfo } from '@/lib/utils/date';
import { useVoting } from '@/lib/hooks/useVoting';
import VotePreview from '@/components/ui/VotePreview';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useState, useEffect } from 'react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { CampaignInfoCard } from '@/components/ui/CampaignInfoCard';
import { CampaignActions } from '@/components/ui/CampaignActions';
import { CalendarIcon, BellIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function VotingPage() {
  const router = useRouter();
  const { id } = useParams();
  const { campaigns, isLoading: isCampaignsLoading } = useCampaigns();
  const { voteBatch, hasVoted, isLoading: isVoting } = useVoting();
  const isMounted = useIsMounted();
  
  // Convert id to string to ensure consistent comparison
  const campaignId = id ? (typeof id === 'string' ? id : String(id)) : '';
  
  // Log for debugging
  console.log('URL Campaign ID:', campaignId);
  console.log('Available Campaign IDs:', campaigns.map(c => ({ id: c.id, title: c.title })));
  
  // Find the campaign with exact string matching
  const campaign = campaigns.find(c => String(c.id) === campaignId);
  
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserVoted, setHasUserVoted] = useState(false);
  
  useEffect(() => {
    if (campaign) {
      hasVoted(campaign.id).then(setHasUserVoted);
    }
  }, [campaign, hasVoted]);
  
  if (!isMounted) return null;
  
  // Show loading state while campaigns are being fetched
  if (isCampaignsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Loading Campaign</h2>
          <p className="mt-2 text-muted-foreground">
            We're retrieving campaign information from the blockchain. This may take a few moments...
          </p>
        </div>
      </div>
    );
  }
  
  // Show not found state if campaign doesn't exist
  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-foreground">Campaign Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/campaigns">
            <Button className="mt-6">View All Campaigns</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Get campaign status
  const { status } = getCampaignTimeInfo(campaign.startDate, campaign.endDate);
  
  // Handle vote selection
  const handleVoteSelect = (positionId: string, candidateId: string) => {
    setSelectedVotes(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const handleVoteSubmit = async () => {
    if (!campaign) return;
    
    try {
      setIsSubmitting(true);
      const votes = Object.entries(selectedVotes).map(([positionId, candidateId]) => ({
        positionId,
        candidateId
      }));
      
      await voteBatch(campaign.id, votes);
      // Navigate directly to results page after successful submission
      router.push(`/campaigns/${id}/results`);
    } catch (error) {
      setIsSubmitting(false);
      console.error('Failed to submit votes:', error);
    }
  };

  if (status !== 'active') {
    return (
      <div className="min-h-screen bg-background">
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                {status === 'upcoming' ? 'Voting Not Started Yet' : 'Voting Has Ended'}
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                {status === 'upcoming' 
                  ? `This campaign will start on ${campaign.startDate.toLocaleDateString()}`
                  : `This campaign ended on ${campaign.endDate.toLocaleDateString()}`
                }
              </p>
            </div>
            
            {status === 'upcoming' && (
              <div className="mb-10">
                <CountdownTimer targetDate={campaign.startDate} />
              </div>
            )}
            
            <div className="mt-8 flex justify-center">
              <Link href={`/campaigns/${id}`}>
                <Button variant="outline">Back to Campaign</Button>
              </Link>
              {status === 'ended' && (
                <Link href={`/campaigns/${id}/results`} className="ml-4">
                  <Button>View Results</Button>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (hasUserVoted) {
    return (
      <div className="min-h-screen bg-background">
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">Already Voted</h2>
              <p className="mt-2 text-muted-foreground">You have already cast your votes for this campaign.</p>
              <Link href={`/campaigns/${id}/results`}>
                <Button className="mt-4">View Results</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main voting interface
  return (
    <div className="min-h-screen bg-background">
      {(isSubmitting || isVoting) && (
        <LoadingOverlay 
          isLoading={true}
          message="Submitting votes... Please confirm the transaction in your wallet" 
          onManualOverride={() => {
            setIsSubmitting(false);
            router.push(`/campaigns/${id}/results`);
          }}
          showManualOverrideAfter={15000}
        />
      )}
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{campaign.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{campaign.description}</p>
            
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-1.5 h-5 w-5 text-muted-foreground" />
                <span>
                  Ends on {campaign.endDate.toLocaleDateString()} at {campaign.endDate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-card-border p-6 mb-8">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Cast Your Vote</h2>
            <p className="text-muted-foreground mb-6">
              Select one candidate for each position. You can review your choices before submitting.
            </p>
            
            <div className="space-y-8">
              {campaign.positions.map(position => {
                const candidates = campaign.candidates.filter(c => c.positionId === position.id);
                
                return (
                  <div key={position.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-lg font-medium text-foreground mb-2">{position.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{position.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {candidates.map(candidate => {
                        const isSelected = selectedVotes[position.id] === candidate.id;
                        
                        return (
                          <div 
                            key={candidate.id}
                            className={`
                              border rounded-lg p-4 cursor-pointer transition-colors
                              ${isSelected 
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' 
                                : 'border-border hover:border-primary-300 dark:hover:border-primary-700'
                              }
                            `}
                            onClick={() => handleVoteSelect(position.id, candidate.id)}
                          >
                            <div className="flex items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{candidate.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{candidate.bio}</p>
                              </div>
                              <div className={`
                                h-5 w-5 rounded-full border-2 flex items-center justify-center
                                ${isSelected 
                                  ? 'border-primary-500 bg-primary-500' 
                                  : 'border-muted-foreground'
                                }
                              `}>
                                {isSelected && (
                                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="default"
                  disabled={Object.keys(selectedVotes).length === 0}
                  onClick={() => setShowPreview(true)}
                >
                  Review & Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Vote Preview Dialog */}
      {showPreview && (
        <VotePreview
          campaign={campaign}
          selectedVotes={selectedVotes}
          onConfirm={handleVoteSubmit}
          onCancel={() => setShowPreview(false)}
          loading={isSubmitting}
        />
      )}
    </div>
  );
}