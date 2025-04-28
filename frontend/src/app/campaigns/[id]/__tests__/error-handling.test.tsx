import { render, screen, waitFor } from '@testing-library/react';
import { useVoting } from '@/lib/hooks/useVoting';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import CampaignLayout from '../layout';

jest.mock('@/lib/hooks/useVoting');
jest.mock('@/lib/hooks/useCampaigns');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    back: jest.fn()
  }),
  useParams: jest.fn().mockReturnValue({ id: '1' })
}));

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles network errors gracefully', async () => {
    const error = new Error('Network error');
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [],
      error,
      loading: false
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('handles invalid campaign IDs', async () => {
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [],
      error: new Error('Campaign not found'),
      loading: false
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/campaign not found/i)).toBeInTheDocument();
    });
  });

  it('handles voting contract errors', async () => {
    const votingError = new Error('Contract execution failed');
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn().mockRejectedValue(votingError),
      error: votingError
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/contract execution failed/i)).toBeInTheDocument();
    });
  });

  it('shows retry button for recoverable errors', async () => {
    const fetchCampaigns = jest.fn();
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [],
      error: new Error('Network error'),
      loading: false,
      fetchCampaigns
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('handles wallet connection errors', async () => {
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: false,
      hasUserVoted: false,
      error: new Error('Wallet not connected'),
      loading: false
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/wallet not connected/i)).toBeInTheDocument();
    });
  });

  it('shows appropriate error for ended campaigns', async () => {
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [{
        id: '1',
        title: 'Test Campaign',
        endDate: new Date(Date.now() - 86400000), // 1 day ago
      }],
      loading: false
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/campaign has ended/i)).toBeInTheDocument();
    });
  });

  it('handles concurrent request errors', async () => {
    const concurrentError = new Error('Too many requests');
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn().mockRejectedValue(concurrentError),
      error: concurrentError
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });

  it('shows error details in development mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Detailed error message');
    error.stack = 'Error stack trace';
    (useCampaigns as jest.Mock).mockReturnValue({
      campaigns: [],
      error,
      loading: false
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/error stack trace/i)).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('handles transaction revert errors', async () => {
    const revertError = new Error('Transaction reverted');
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn().mockRejectedValue(revertError),
      error: revertError
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/transaction reverted/i)).toBeInTheDocument();
    });
  });

  it('provides user-friendly error messages', async () => {
    const technicalError = new Error('CALL_EXCEPTION');
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn().mockRejectedValue(technicalError),
      error: technicalError
    });

    render(<CampaignLayout>Test Content</CampaignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/failed to submit vote/i)).toBeInTheDocument();
    });
  });
});