'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Campaign } from '@/lib/types/campaign';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getCampaignTimeInfo, getStatusColor } from '@/lib/utils/date';
import { useEffect, useState } from 'react';
import { useIsMounted } from '@/lib/hooks/useIsMounted';

interface CampaignListProps {
  campaigns: Campaign[];
  emptyMessage?: string;
}

export default function CampaignList({ 
  campaigns,
  emptyMessage = "No campaigns found"
}: CampaignListProps) {
  const isMounted = useIsMounted();
  const [, setTimeUpdate] = useState(0);

  // Update time every second for active campaigns only if mounted
  useEffect(() => {
    if (!isMounted) return;

    const timer = setInterval(() => {
      setTimeUpdate(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const { status, timeRemaining, progress } = getCampaignTimeInfo(
          campaign.startDate,
          campaign.endDate
        );
        const colors = getStatusColor(status);

        return (
          <div
            key={campaign.id}
            className="flex flex-col bg-card shadow-card rounded-lg border border-border overflow-hidden hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1"
          >
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {campaign.title}
                </h3>
                <span className="text-sm text-muted-foreground">{timeRemaining}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {campaign.organizationName}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <ProgressBar 
                  progress={progress} 
                  colorClass={colors.progressBar} 
                  height="h-1.5"
                />
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span>{campaign.startDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>End:</span>
                  <span>{campaign.endDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Positions:</span>
                  <span>{campaign.positions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Candidates:</span>
                  <span>{campaign.candidates.length}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-muted border-t border-border">
              {status === 'upcoming' && (
                <div className="flex flex-col space-y-2">
                  <Link href={`/campaigns/${campaign.id}/vote`}>
                    <Button 
                      className="w-full font-semibold" 
                      variant="outline"
                    >
                      View Campaign
                    </Button>
                  </Link>
                  
                  {/* Add configuration link for campaigns that haven't started */}
                  <Link href={`/campaigns/${campaign.id}/configure`}>
                    <Button 
                      className="w-full font-semibold" 
                      variant="default"
                    >
                      Configure Campaign
                    </Button>
                  </Link>
                </div>
              )}
              
              {status === 'active' && (
                <Link href={`/campaigns/${campaign.id}/vote`}>
                  <Button 
                    className="w-full font-semibold" 
                    variant="default"
                  >
                    Vote Now
                  </Button>
                </Link>
              )}
              
              {status === 'ended' && (
                <Link href={`/campaigns/${campaign.id}/results`}>
                  <Button 
                    className="w-full font-semibold" 
                    variant="outline"
                  >
                    View Results
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}