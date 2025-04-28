import { Campaign } from '../types/campaign';

export type CampaignStatus = 'upcoming' | 'active' | 'ended';
export type CampaignTimeInfo = {
  status: CampaignStatus;
  timeRemaining: string;
  progress: number;
};

export function getCampaignTimeInfo(startDate: Date, endDate: Date): CampaignTimeInfo {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

  let status: CampaignStatus = 'upcoming';
  let timeRemaining = '';

  if (now < start) {
    status = 'upcoming';
    const diff = start.getTime() - now.getTime();
    timeRemaining = formatTimeRemaining(diff);
  } else if (now > end) {
    status = 'ended';
    timeRemaining = 'Campaign ended';
  } else {
    status = 'active';
    const diff = end.getTime() - now.getTime();
    timeRemaining = formatTimeRemaining(diff);
  }

  return { status, timeRemaining, progress };
}

function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}

export const getStatusColor = (status: CampaignStatus) => {
  switch (status) {
    case 'upcoming':
      return {
        text: 'text-black',
        bg: 'bg-primary-100',
        ring: 'ring-primary-500/20',
        progressBar: 'bg-primary-500'
      };
    case 'active':
      return {
        text: 'text-black',
        bg: 'bg-primary-500',
        ring: 'ring-primary-600/20',
        progressBar: 'bg-primary-600'
      };
    case 'ended':
      return {
        text: 'text-white',
        bg: 'bg-secondary',
        ring: 'ring-secondary/20',
        progressBar: 'bg-secondary'
      };
  }
};