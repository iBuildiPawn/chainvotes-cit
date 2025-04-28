import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BellIcon, CalendarIcon, ShareIcon } from '@heroicons/react/24/outline';

interface CampaignActionsProps {
  campaignId: string;
  onAddToCalendar?: () => void;
  onSetReminder?: () => void;
  onShare?: () => void;
}

export function CampaignActions({ 
  campaignId, 
  onAddToCalendar, 
  onSetReminder, 
  onShare 
}: CampaignActionsProps) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Actions</h3>
        
        <div className="space-y-3">
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Button>
          </Link>
          
          <Link href={`/campaigns/${campaignId}/preview`} className="w-full">
            <Button variant="outline" className="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Preview Ballot
            </Button>
          </Link>
          
          {onAddToCalendar && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={onAddToCalendar}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Add to Calendar
            </Button>
          )}
          
          {onSetReminder && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={onSetReminder}
            >
              <BellIcon className="h-5 w-5 mr-2" />
              Set Reminder
            </Button>
          )}
          
          {onShare && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={onShare}
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Share Campaign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 