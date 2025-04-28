import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useVoting } from '@/lib/hooks/useVoting';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import VotingPage from '../vote/page';

jest.mock('@/lib/hooks/useVoting');
jest.mock('@/lib/hooks/useCampaigns');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn()
  }),
  useParams: jest.fn().mockReturnValue({ id: '1' })
}));

describe('Voting Integration', () => {
  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    description: 'Test Description',
    startDate: new Date(Date.now() - 1000 * 60 * 60),
    endDate: new Date(Date.now() + 1000 * 60 * 60),
    positions: [
      { id: '1', name: 'Position 1' },
      { id: '2', name: 'Position 2' }
    ],
    candidates: [
      { id: '1', name: 'Candidate 1', positionId: '1' },
      { id: '2', name: 'Candidate 2', positionId: '1' },
      { id: '3', name: 'Candidate 3', positionId: '2' },
      { id: '4', name: 'Candidate 4', positionId: '2' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [mockCampaign],
      loading: false
    });
  });

  it('completes full voting flow successfully', async () => {
    const submitVote = jest.fn().mockResolvedValue({ hash: '0x123' });
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote,
      getVoteCounts: jest.fn()
    });

    render(<VotingPage />);

    // Select votes
    fireEvent.click(screen.getByTestId('candidate-1'));
    fireEvent.click(screen.getByTestId('candidate-3'));

    // Preview votes
    fireEvent.click(screen.getByText(/preview votes/i));
    await waitFor(() => {
      expect(screen.getByText(/confirm votes/i)).toBeInTheDocument();
    });

    // Submit votes
    fireEvent.click(screen.getByText(/confirm votes/i));
    await waitFor(() => {
      expect(submitVote).toHaveBeenCalledWith(
        mockCampaign.id,
        ['1', '2'], // position IDs
        ['1', '3']  // candidate IDs
      );
    });

    // Success state
    expect(screen.getByText(/votes submitted successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/0x123/i)).toBeInTheDocument(); // Transaction hash
  });

  it('handles multiple vote changes before submission', async () => {
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn().mockResolvedValue({ hash: '0x123' }),
      getVoteCounts: jest.fn()
    });

    render(<VotingPage />);

    // First selection
    fireEvent.click(screen.getByTestId('candidate-1'));
    fireEvent.click(screen.getByTestId('candidate-3'));

    // Change votes
    fireEvent.click(screen.getByTestId('candidate-2')); // Changes Position 1 vote
    fireEvent.click(screen.getByTestId('candidate-4')); // Changes Position 2 vote

    // Preview should show updated selections
    fireEvent.click(screen.getByText(/preview votes/i));
    
    await waitFor(() => {
      expect(screen.getByText('Candidate 2')).toBeInTheDocument();
      expect(screen.getByText('Candidate 4')).toBeInTheDocument();
    });
  });

  it('validates vote completeness before submission', async () => {
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn(),
      getVoteCounts: jest.fn()
    });

    render(<VotingPage />);

    // Only select one position
    fireEvent.click(screen.getByTestId('candidate-1'));

    // Try to preview
    fireEvent.click(screen.getByText(/preview votes/i));

    await waitFor(() => {
      expect(screen.getByText(/must vote for all positions/i)).toBeInTheDocument();
    });
  });

  it('shows loading states during transactions', async () => {
    const submitVote = jest.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    });

    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote,
      getVoteCounts: jest.fn()
    });

    render(<VotingPage />);

    // Complete selections
    fireEvent.click(screen.getByTestId('candidate-1'));
    fireEvent.click(screen.getByTestId('candidate-3'));

    // Submit votes
    fireEvent.click(screen.getByText(/preview votes/i));
    await waitFor(() => {
      fireEvent.click(screen.getByText(/confirm votes/i));
    });

    // Check loading state
    expect(screen.getByText(/submitting votes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();

    // Wait for completion
    await act(async () => {
      await submitVote();
    });
  });

  it('updates vote counts after successful submission', async () => {
    const getVoteCounts = jest.fn().mockResolvedValue({
      '1': { '1': 5, '2': 3 },
      '2': { '3': 4, '4': 6 }
    });

    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn().mockResolvedValue({ hash: '0x123' }),
      getVoteCounts
    });

    render(<VotingPage />);

    // Complete voting flow
    fireEvent.click(screen.getByTestId('candidate-1'));
    fireEvent.click(screen.getByTestId('candidate-3'));
    fireEvent.click(screen.getByText(/preview votes/i));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/confirm votes/i));
    });

    // Check updated vote counts
    await waitFor(() => {
      expect(getVoteCounts).toHaveBeenCalledWith(mockCampaign.id);
      expect(screen.getByText('5')).toBeInTheDocument(); // Vote count for candidate 1
      expect(screen.getByText('4')).toBeInTheDocument(); // Vote count for candidate 3
    });
  });
});