import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VotingPage from '../page';
import { useVoting } from '@/lib/hooks/useVoting';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { act } from 'react-dom/test-utils';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => ({
    id: '1',
  }),
}));

vi.mock('@/lib/hooks/useVoting');
vi.mock('@/lib/hooks/useCampaigns');
vi.mock('@/lib/hooks/useIsMounted', () => ({
  useIsMounted: () => true,
}));

describe('VotingPage', () => {
  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    positions: [
      { id: '1', name: 'Position 1' },
      { id: '2', name: 'Position 2' },
    ],
    candidates: [
      { id: '1', name: 'Candidate 1', positionId: '1' },
      { id: '2', name: 'Candidate 2', positionId: '1' },
      { id: '3', name: 'Candidate 3', positionId: '2' },
    ],
    startDate: new Date(Date.now() - 1000 * 60 * 60),
    endDate: new Date(Date.now() + 1000 * 60 * 60),
  };

  const mockVotingHook = {
    submitVotes: vi.fn(),
    hasVoted: vi.fn(),
    isVoting: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCampaigns as any).mockReturnValue({
      campaigns: [mockCampaign],
      loading: false,
    });
    (useVoting as any).mockReturnValue(mockVotingHook);
  });

  it('renders voting interface with positions and candidates', () => {
    render(<VotingPage />);
    
    expect(screen.getByText('Position 1')).toBeInTheDocument();
    expect(screen.getByText('Position 2')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('allows selecting one candidate per position', async () => {
    render(<VotingPage />);
    
    const candidate1Radio = screen.getByLabelText('Candidate 1');
    const candidate3Radio = screen.getByLabelText('Candidate 3');

    await act(async () => {
      fireEvent.click(candidate1Radio);
      fireEvent.click(candidate3Radio);
    });

    expect(candidate1Radio).toBeChecked();
    expect(candidate3Radio).toBeChecked();
  });

  it('shows preview before submitting votes', async () => {
    render(<VotingPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Candidate 1'));
      fireEvent.click(screen.getByLabelText('Candidate 3'));
      fireEvent.click(screen.getByText('Preview Votes'));
    });

    expect(screen.getByText('Review Your Votes')).toBeInTheDocument();
    expect(screen.getByText('Position 1: Candidate 1')).toBeInTheDocument();
    expect(screen.getByText('Position 2: Candidate 3')).toBeInTheDocument();
  });

  it('submits votes successfully', async () => {
    mockVotingHook.submitVotes.mockResolvedValue({ success: true });
    
    render(<VotingPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Candidate 1'));
      fireEvent.click(screen.getByLabelText('Candidate 3'));
      fireEvent.click(screen.getByText('Preview Votes'));
      fireEvent.click(screen.getByText('Confirm Votes'));
    });

    expect(mockVotingHook.submitVotes).toHaveBeenCalledWith('1', [
      { positionId: '1', candidateId: '1' },
      { positionId: '2', candidateId: '3' },
    ]);
  });

  it('handles voting errors gracefully', async () => {
    const errorMessage = 'Failed to submit votes';
    mockVotingHook.submitVotes.mockRejectedValue(new Error(errorMessage));
    
    render(<VotingPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Candidate 1'));
      fireEvent.click(screen.getByText('Preview Votes'));
      fireEvent.click(screen.getByText('Confirm Votes'));
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('prevents voting if campaign has ended', () => {
    const endedCampaign = {
      ...mockCampaign,
      endDate: new Date(Date.now() - 1000),
    };
    (useCampaigns as any).mockReturnValue({
      campaigns: [endedCampaign],
      loading: false,
    });

    render(<VotingPage />);
    
    expect(screen.getByText('Voting has ended')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('prevents voting if user has already voted', () => {
    mockVotingHook.hasVoted.mockReturnValue(true);
    
    render(<VotingPage />);
    
    expect(screen.getByText('You have already voted')).toBeInTheDocument();
    expect(screen.getByText('View Results')).toBeInTheDocument();
  });

  it('shows loading state during vote submission', async () => {
    let resolveSubmit: (value: { success: boolean }) => void;
    mockVotingHook.submitVotes.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      })
    );
    
    render(<VotingPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Candidate 1'));
      fireEvent.click(screen.getByText('Preview Votes'));
      fireEvent.click(screen.getByText('Confirm Votes'));
    });

    expect(screen.getByText('Submitting votes...')).toBeInTheDocument();
    
    await act(async () => {
      resolveSubmit({ success: true });
    });

    expect(screen.queryByText('Submitting votes...')).not.toBeInTheDocument();
  });
});