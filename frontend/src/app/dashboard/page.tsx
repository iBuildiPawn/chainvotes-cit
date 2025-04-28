'use client';
import { useState, useEffect, useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import CampaignList from '@/components/campaigns/CampaignList';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useIsMounted } from '@/lib/hooks/useIsMounted';
import { CampaignFilter, CampaignFilterType } from '@/components/campaigns/CampaignFilter';
import { getCampaignTimeInfo } from '@/lib/utils/date';

export default function Dashboard() {
  const isMounted = useIsMounted();
  const { campaigns, isLoading } = useCampaigns();
  const [selectedFilter, setSelectedFilter] = useState<CampaignFilterType>('all');
  
  const { filteredCampaigns, counts } = useMemo(() => {
    if (!campaigns) {
      return { 
        filteredCampaigns: [], 
        counts: { all: 0, active: 0, upcoming: 0, ended: 0 } 
      };
    }
    
    const newCounts = {
      all: campaigns.length,
      active: campaigns.filter(c => getCampaignTimeInfo(c.startDate, c.endDate).status === 'active').length,
      upcoming: campaigns.filter(c => getCampaignTimeInfo(c.startDate, c.endDate).status === 'upcoming').length,
      ended: campaigns.filter(c => getCampaignTimeInfo(c.startDate, c.endDate).status === 'ended').length,
    };
    
    const filtered = campaigns.filter(campaign => {
      if (selectedFilter === 'all') return true;
      const { status } = getCampaignTimeInfo(campaign.startDate, campaign.endDate);
      return status === selectedFilter;
    });
    
    return { filteredCampaigns: filtered, counts: newCounts };
  }, [campaigns, selectedFilter]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Loading Campaigns</h2>
          <p className="mt-2 text-muted-foreground">
            We're retrieving campaign information from the blockchain. This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="py-10">
        <div className="max-w-7xl mx-auto">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                View and manage your voting campaigns
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:gap-4">
              <CampaignFilter
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                counts={counts}
              />
              <Link href="/campaigns/create">
                <Button 
                  size="lg" 
                  className="shadow-md shadow-primary-500/20 border-2 border-primary-500/50 text-black font-semibold hover:text-black"
                >
                  <PlusIcon className="h-5 w-5 mr-2" /> Create Campaign
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <CampaignList
              campaigns={filteredCampaigns}
              emptyMessage={
                selectedFilter === 'all'
                  ? "No campaigns found. Create your first campaign to get started!"
                  : `No ${selectedFilter} campaigns found.`
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}