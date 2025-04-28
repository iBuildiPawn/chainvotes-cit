'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useIsMounted } from '@/lib/hooks/useIsMounted';
import { Button } from '@/components/ui/Button';
import { getCampaignTimeInfo } from '@/lib/utils/date';
import { useVoting } from '@/lib/hooks/useVoting';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useEffect, useMemo, useState } from 'react';
import { VoteCounts } from '@/lib/hooks/useVoting';
import { 
  TrophyIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ShareIcon,
  WalletIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { CampaignInfoCard } from '@/components/ui/CampaignInfoCard';
import { Dialog } from '@/components/ui/Dialog';

// Helper function to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Helper function to truncate wallet addresses
const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export default function ResultsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { campaigns, isLoading: isCampaignsLoading } = useCampaigns();
  const { getVoteCounts, fetchVoteCounts } = useVoting();
  const isMounted = useIsMounted();
  const [isLoading, setIsLoading] = useState(true);
  const [voteCounts, setVoteCounts] = useState<Record<string, VoteCounts>>({});
  const [selectedVoters, setSelectedVoters] = useState<{
    isOpen: boolean;
    positionName: string;
    candidateName: string;
    voters: string[];
  }>({
    isOpen: false,
    positionName: '',
    candidateName: '',
    voters: []
  });
  
  // Convert id to string to ensure consistent comparison
  const campaignId = id ? (typeof id === 'string' ? id : String(id)) : '';
  
  // Find the campaign with exact string matching
  const campaign = campaigns.find(c => String(c.id) === campaignId);

  // Calculate results only when we have both campaign and vote data
  const positionResults = useMemo(() => {
    if (!campaign || !voteCounts[campaign.id]) return [];
    
    return campaign.positions.map(position => {
      const candidates = campaign.candidates.filter(c => c.positionId === position.id);
      const positionVotes = voteCounts[campaign.id][position.id] || {};
      
      // Calculate total votes for this position
      const totalVotes = candidates.reduce((sum, c) => {
        const votes = positionVotes[c.id]?.count || 0;
        return sum + votes;
      }, 0);

      // Sort candidates by vote count (descending)
      const sortedCandidates = [...candidates].sort((a, b) => {
        const votesA = positionVotes[a.id]?.count || 0;
        const votesB = positionVotes[b.id]?.count || 0;
        return votesB - votesA;
      });

      // Determine winner(s) - there could be ties
      const highestVotes = sortedCandidates.length > 0 
        ? positionVotes[sortedCandidates[0].id]?.count || 0
        : 0;
      
      const winners = sortedCandidates.filter(c => 
        (positionVotes[c.id]?.count || 0) === highestVotes && highestVotes > 0
      );

      return {
        position,
        candidates: sortedCandidates,
        positionVotes,
        totalVotes,
        winners
      };
    });
  }, [campaign, voteCounts]);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    if (!campaign || !voteCounts[campaign.id]) return null;
    
    // Get all unique voter addresses across all positions
    const uniqueVoters = new Set();
    let totalVotesCast = 0;
    
    Object.values(voteCounts[campaign.id] || {}).forEach(positionVotes => {
      Object.values(positionVotes).forEach(candidateData => {
        if (candidateData && candidateData.voters) {
          candidateData.voters.forEach(address => uniqueVoters.add(address));
          totalVotesCast += candidateData.voters.length;
        }
      });
    });

    return {
      uniqueVoters: uniqueVoters.size,
      totalVotesCast,
      positions: campaign.positions.length,
      candidates: campaign.candidates.length,
      averageVotesPerPosition: campaign.positions.length > 0 
        ? totalVotesCast / campaign.positions.length 
        : 0
    };
  }, [campaign, voteCounts]);

  // Function to show voters for a specific candidate
  const showVoters = (positionName: string, candidateName: string, voters: string[]) => {
    setSelectedVoters({
      isOpen: true,
      positionName,
      candidateName,
      voters: voters || []
    });
  };

  // Function to close the voters modal
  const closeVotersModal = () => {
    setSelectedVoters(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Function to copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Fetch vote counts when campaign changes
  useEffect(() => {
    async function loadVotes() {
      if (campaign) {
        setIsLoading(true);
        try {
          const counts = await fetchVoteCounts(campaign.id);
          setVoteCounts(prev => ({
            ...prev,
            [campaign.id]: counts || {}
          }));
        } catch (error) {
          console.error('Error fetching vote counts:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadVotes();
  }, [campaign, fetchVoteCounts]);
  
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
  
  // Only show "Campaign not found" after we've confirmed campaigns are loaded
  if (!campaign && !isCampaignsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-foreground">Campaign Not Found</h2>
          <p className="mt-2 text-muted-foreground mb-6">
            The campaign you're looking for doesn't exist or may have been removed.
          </p>
          <Link href="/campaigns">
            <Button className="mt-4">View All Campaigns</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { status } = getCampaignTimeInfo(campaign.startDate, campaign.endDate);

  if (status === 'upcoming') {
    return (
      <div className="min-h-screen bg-background">
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">Results Not Available</h2>
              <p className="mt-2 text-muted-foreground">
                This campaign hasn't started yet. Check back after {campaign.startDate.toLocaleDateString()}.
              </p>
              <Link href={`/campaigns/${id}`}>
                <Button className="mt-4">Back to Campaign</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Loading Results</h2>
          <p className="mt-2 text-muted-foreground">
            We're retrieving voting results from the blockchain. This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {status === 'ended' ? 'Final Results' : 'Live Results'}
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">{campaign.title}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {status === 'active' && (
                  <Link href={`/campaigns/${id}/vote`}>
                    <Button variant="default">Vote Now</Button>
                  </Link>
                )}
                <Link href={`/campaigns/${id}`}>
                  <Button variant="outline">Back to Campaign</Button>
                </Link>
              </div>
            </div>
            
            {/* Campaign info and status banner */}
            <div className={`mt-6 p-4 rounded-lg border ${
              status === 'ended' 
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' 
                : 'bg-muted/70 border-border'
            }`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  status === 'ended' 
                    ? 'bg-amber-100 dark:bg-amber-900/50' 
                    : 'bg-muted-foreground/20'
                }`}>
                  {status === 'ended' 
                    ? <CheckBadgeIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" /> 
                    : <ArrowTrendingUpIcon className="h-6 w-6 text-foreground/80" />
                  }
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-semibold ${
                    status === 'ended' ? 'text-amber-800 dark:text-amber-300' : 'text-foreground'
                  }`}>
                    {status === 'ended' ? 'Voting has ended' : 'Voting is in progress'}
                  </h3>
                  <p className="mt-1 text-sm text-foreground/80 dark:text-foreground/90">
                    {status === 'ended' 
                      ? `This campaign ended on ${formatDate(campaign.endDate)}` 
                      : `This campaign will end on ${formatDate(campaign.endDate)}`
                    }
                  </p>
                  {status === 'ended' && statistics && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                        <span className="text-sm text-foreground/80 dark:text-foreground/90">
                          <span className="font-medium text-foreground">{statistics.uniqueVoters}</span> unique voters
                        </span>
                      </div>
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                        <span className="text-sm text-foreground/80 dark:text-foreground/90">
                          <span className="font-medium text-foreground">{statistics.totalVotesCast}</span> total votes
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                        <span className="text-sm text-foreground/80 dark:text-foreground/90">
                          <span className="font-medium text-foreground">{campaign.positions.length}</span> positions
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Winners section (only for ended campaigns) */}
          {status === 'ended' && (
            <div className="mb-10">
              <div className="flex items-center mb-4">
                <TrophyIcon className="h-6 w-6 text-amber-600 mr-2" />
                <h2 className="text-2xl font-bold text-foreground">Winners</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {positionResults.map(({ position, winners, positionVotes }) => (
                  <div key={`winner-${position.id}`} className="bg-card rounded-lg border border-card-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-card-border bg-muted/50">
                      <h3 className="font-medium text-foreground">{position.name}</h3>
                    </div>
                    <div className="p-4">
                      {winners.length === 0 ? (
                        <p className="text-sm text-foreground/80 dark:text-foreground/90 italic">No votes recorded</p>
                      ) : winners.length === 1 ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-foreground">{winners[0].name}</p>
                            <p className="text-sm text-foreground/80 dark:text-foreground/90 font-medium">
                              {positionVotes[winners[0].id]?.count || 0} votes
                            </p>
                            <button 
                              onClick={() => showVoters(
                                position.name, 
                                winners[0].name, 
                                positionVotes[winners[0].id]?.voters || []
                              )}
                              className="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center font-medium"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {(positionVotes[winners[0].id]?.voters?.length || 0)} {(positionVotes[winners[0].id]?.voters?.length || 0) === 1 ? 'wallet' : 'wallets'} - View voters
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Tie between:</p>
                          <div className="space-y-3">
                            {winners.map(winner => (
                              <div key={winner.id} className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                  <TrophyIcon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-foreground">{winner.name}</p>
                                  <p className="text-xs text-foreground/80 dark:text-foreground/90 font-medium">
                                    {positionVotes[winner.id]?.count || 0} votes
                                  </p>
                                  <button 
                                    onClick={() => showVoters(
                                      position.name, 
                                      winner.name, 
                                      positionVotes[winner.id]?.voters || []
                                    )}
                                    className="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center font-medium"
                                  >
                                    <EyeIcon className="h-3 w-3 mr-1" />
                                    {(positionVotes[winner.id]?.voters?.length || 0)} {(positionVotes[winner.id]?.voters?.length || 0) === 1 ? 'wallet' : 'wallets'} - View voters
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Results */}
          <div>
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-6 w-6 text-amber-600 mr-2" />
              <h2 className="text-2xl font-bold text-foreground">
                {status === 'ended' ? 'Full Results' : 'Current Results'}
              </h2>
            </div>
            
            <div className="space-y-8">
              {positionResults.map(({ position, candidates, positionVotes, totalVotes, winners }) => {
                const winnerIds = winners.map(w => w.id);
                
                return (
                  <div key={position.id} className="bg-card rounded-lg border border-card-border overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-card-border">
                      <h3 className="text-xl font-medium text-card-foreground">{position.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{position.description}</p>
                      <p className="mt-2 text-sm font-medium text-card-foreground">
                        Total votes: {totalVotes}
                      </p>
                    </div>
                    
                    <div className="divide-y divide-card-border">
                      {candidates.map((candidate, index) => {
                        const voteCount = positionVotes[candidate.id]?.count || 0;
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        const isWinner = winnerIds.includes(candidate.id) && status === 'ended';
                        const rank = index + 1;
                        const voters = positionVotes[candidate.id]?.voters || [];
                        
                        return (
                          <div 
                            key={candidate.id} 
                            className={`p-4 ${isWinner ? 'bg-amber-50/80 dark:bg-amber-950/40' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                                  isWinner 
                                    ? 'bg-amber-100 dark:bg-amber-900/50' 
                                    : 'bg-muted/70'
                                }`}>
                                  {isWinner ? (
                                    <TrophyIcon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                  ) : (
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {rank}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${isWinner ? 'text-amber-800 dark:text-amber-300' : 'text-card-foreground'}`}>
                                    {candidate.name} {isWinner && <span className="text-amber-600 dark:text-amber-500 ml-1 font-semibold">Winner</span>}
                                  </p>
                                  {candidate.description && (
                                    <p className="text-xs text-foreground/80 dark:text-foreground/90 mt-0.5">{candidate.description}</p>
                                  )}
                                  {voteCount > 0 && (
                                    <button 
                                      onClick={() => showVoters(position.name, candidate.name, voters)}
                                      className="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center font-medium"
                                    >
                                      <WalletIcon className="h-3 w-3 mr-1" />
                                      {voters.length} {voters.length === 1 ? 'wallet' : 'wallets'} - View details
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-card-foreground">
                                  {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">
                                  {percentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            
                            <ProgressBar 
                              progress={percentage} 
                              colorClass={isWinner ? 'bg-amber-600' : 'bg-primary-500'} 
                              height={isWinner ? 'h-3' : 'h-2'}
                            />
                          </div>
                        );
                      })}
                      
                      {candidates.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground font-medium italic">
                          No candidates found for this position
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {positionResults.length === 0 && (
                <div className="bg-card rounded-lg border border-card-border p-8 text-center">
                  <p className="text-muted-foreground font-medium">No voting data available yet</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Share section */}
          {status === 'ended' && (
            <div className="mt-10 bg-amber-50/70 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 p-6 text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">Share these results</h3>
              <p className="text-sm text-foreground/80 dark:text-foreground/90 mb-4">
                Let others know about the outcome of this campaign
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${campaign.title} - Results`,
                      text: `Check out the results of the ${campaign.title} campaign!`,
                      url: window.location.href,
                    });
                  } else {
                    // Fallback for browsers that don't support the Web Share API
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share Results
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Voters Modal */}
      {selectedVoters.isOpen && (
        <Dialog isOpen={selectedVoters.isOpen} onClose={closeVotersModal}>
          <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-card p-6 shadow-xl w-full border border-card-border">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold text-card-foreground">
                Voters for {selectedVoters.candidateName}
              </Dialog.Title>
              <button
                onClick={closeVotersModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              Position: {selectedVoters.positionName}
            </p>
            
            {selectedVoters.voters.length === 0 ? (
              <div className="text-center py-8">
                <WalletIcon className="h-12 w-12 text-muted-foreground/80 mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">No voter data available</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <div className="border rounded-lg divide-y divide-card-border">
                  {selectedVoters.voters.map((voter, index) => (
                    <div key={index} className="p-3 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center">
                        <WalletIcon className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm font-mono text-foreground">{truncateAddress(voter)}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(voter)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        title="Copy to clipboard"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={closeVotersModal}>
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </Dialog>
      )}
    </div>
  );
}