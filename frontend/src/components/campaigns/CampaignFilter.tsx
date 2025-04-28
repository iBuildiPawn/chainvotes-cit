'use client';
import { Menu } from '@headlessui/react';
import { FunnelIcon, CheckIcon } from '@heroicons/react/20/solid';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useIsMounted } from '@/lib/hooks/useIsMounted';

export type CampaignFilterType = 'all' | 'active' | 'upcoming' | 'ended';

interface CampaignFilterProps {
  selectedFilter: CampaignFilterType;
  onFilterChange: (filter: CampaignFilterType) => void;
  counts: {
    all: number;
    active: number;
    upcoming: number;
    ended: number;
  };
}

const filters: { value: CampaignFilterType; label: string }[] = [
  { value: 'all', label: 'All Campaigns' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ended', label: 'Ended' },
];

export function CampaignFilter({ selectedFilter, onFilterChange, counts }: CampaignFilterProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full items-center justify-between gap-x-1.5 rounded-md bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-muted transition-colors">
          <FunnelIcon className="-ml-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          {filters.find(f => f.value === selectedFilter)?.label}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-border focus:outline-none">
        <div className="py-1">
          {filters.map((filter) => (
            <Menu.Item key={filter.value}>
              {({ active }) => (
                <button
                  onClick={() => onFilterChange(filter.value)}
                  className={`
                    ${active ? 'bg-muted text-foreground' : 'text-foreground'}
                    ${selectedFilter === filter.value ? 'bg-primary-500/10' : ''}
                    group flex w-full items-center justify-between px-4 py-2 text-sm transition-colors
                  `}
                >
                  <span>{filter.label}</span>
                  <span className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-2">
                      {counts[filter.value]}
                    </span>
                    {selectedFilter === filter.value && (
                      <CheckIcon className="h-4 w-4 text-primary-500" aria-hidden="true" />
                    )}
                  </span>
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}