import { render, screen, waitFor } from '@testing-library/react';
import ResultsPage from '../page';
import { useVoting } from '@/lib/hooks/useVoting';
import { useCampaigns } from '@/lib/hooks/useCampaigns';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({
    id: '1',
  }),
}));

// Mock the hooks
jest.mock('@/lib/hooks/useVoting');
jest.mock('@/lib/hooks/useCampaigns');
jest.mock('@/lib/hooks/useIsMounted', () => ({
  useIsMounted: () => true,
}));

describe('ResultsPage', () => {
  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    description: 'Test Description',
    startDate: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    endDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    positions: [
      { id: '1', name: 'Position 1', description: 'Position 1 Description' },
    ],
    candidates: [
      { id: '1', name: 'Candidate 1', positionId: '1' },
      { id: '2', name: 'Candidate 2', positionId: '1' },
    ],
  };

  const mockVoteCounts = {
    '1': { '1': 5, '2': 3 }, // Position 1: Candidate 1 has 5 votes, Candidate 2 has 3 votes
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useCampaigns
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [mockCampaign],
    });
    
    // Mock useVoting
    (useVoting as jest.Mock).mockReturnValue({
      getVoteCounts: jest.fn((campaignId, positionId) => mockVoteCounts[positionId] || {}),
      fetchVoteCounts: jest.fn(),
    });
  });

  it('renders the results page with campaign details', () => {
    render(<ResultsPage />);
    
    expect(screen.getByText('Results: Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('Position 1')).toBeInTheDocument();
    expect(screen.getByText('Candidate 1')).toBeInTheDocument();
    expect(screen.getByText('Candidate 2')).toBeInTheDocument();
  });

  it('shows vote counts and percentages', async () => {
    render(<ResultsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('5 votes (62.5%)')).toBeInTheDocument();
      expect(screen.getByText('3 votes (37.5%)')).toBeInTheDocument();
      expect(screen.getByText('Total votes: 8')).toBeInTheDocument();
    });
  });

  it('shows "Vote Now" button for active campaigns', () => {
    render(<ResultsPage />);
    
    expect(screen.getByText('Vote Now')).toBeInTheDocument();
    expect(screen.getByText('Live results')).toBeInTheDocument();
  });

  it('hides "Vote Now" button for ended campaigns', () => {
    const endedCampaign = {
      ...mockCampaign,
      endDate: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    };
    
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [endedCampaign],
    });

    render(<ResultsPage />);
    
    expect(screen.queryByText('Vote Now')).not.toBeInTheDocument();
    expect(screen.getByText('Final results')).toBeInTheDocument();
  });

  it('shows "Results not available" for upcoming campaigns', () => {
    const upcomingCampaign = {
      ...mockCampaign,
      startDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
    };
    
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [upcomingCampaign],
    });

    render(<ResultsPage />);
    
    expect(screen.getByText('Results not available')).toBeInTheDocument();
  });

  it('fetches vote counts on mount', () => {
    const fetchVoteCountsMock = jest.fn();
    (useVoting as jest.Mock).mockReturnValue({
      getVoteCounts: jest.fn(),
      fetchVoteCounts: fetchVoteCountsMock,
    });

    render(<ResultsPage />);
    
    expect(fetchVoteCountsMock).toHaveBeenCalledWith('1');
  });

  it('shows campaign not found message for invalid campaign', () => {
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [],
    });

    render(<ResultsPage />);
    
    expect(screen.getByText('Campaign not found')).toBeInTheDocument();
  });
});