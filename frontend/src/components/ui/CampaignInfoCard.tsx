import React from 'react';
import { Campaign } from '@/lib/types/campaign';
import { getCampaignTimeInfo, getStatusColor } from '@/lib/utils/date';
import { CalendarIcon, ClockIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface CampaignInfoCardProps {
  campaign: Campaign;
}

export function CampaignInfoCard({ campaign }: CampaignInfoCardProps) {
  const { status } = getCampaignTimeInfo(campaign.startDate, campaign.endDate);
  const statusColors = getStatusColor(status);
  
  return (
    <div className="bg-card-background shadow-md rounded-lg overflow-hidden border border-card-border">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-card-foreground">{campaign.title}</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
            {status === 'upcoming' ? 'Upcoming' : status === 'active' ? 'Active' : 'Ended'}
          </span>
        </div>
        
        <p className="mt-2 text-muted-foreground">{campaign.description}</p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-primary-500 mr-2" />
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-sm font-medium text-card-foreground">{campaign.startDate.toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-primary-500 mr-2" />
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="text-sm font-medium text-card-foreground">{campaign.endDate.toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-primary-500 mr-2" />
            <div>
              <p className="text-sm text-muted-foreground">Positions</p>
              <p className="text-sm font-medium text-card-foreground">{campaign.positions.length} positions</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-primary-500 mr-2" />
            <div>
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-sm font-medium text-card-foreground">{campaign.candidates.length} candidates</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">Organized by</p>
          <p className="text-sm font-medium text-card-foreground">{campaign.organizationName}</p>
        </div>
      </div>
    </div>
  );
} 