import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useVoting } from '@/lib/hooks/useVoting';
import VotingPage from '../vote/page';

jest.mock('@/lib/hooks/useVoting');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn()
  }),
  useParams: jest.fn().mockReturnValue({ id: '1' })
}));

describe('Performance Tests', () => {
  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    positions: Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      name: `Position ${i + 1}`
    })),
    candidates: Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Candidate ${i + 1}`,
      positionId: String(Math.floor(i / 5) + 1)
    }))
  };

  beforeEach(() => {
    jest.useFakeTimers();
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn(),
      getVoteCounts: jest.fn()
    });
    performance.mark('testStart');
  });

  afterEach(() => {
    jest.useRealTimers();
    performance.clearMarks();
    performance.clearMeasures();
  });

  it('renders initial page load within 200ms', () => {
    render(<VotingPage />);
    
    act(() => {
      jest.advanceTimersByTime(200);
    });

    performance.mark('testEnd');
    performance.measure('pageLoad', 'testStart', 'testEnd');
    const measure = performance.getEntriesByName('pageLoad')[0];
    
    expect(measure.duration).toBeLessThanOrEqual(200);
    expect(screen.getByText(/loading/i)).not.toBeInTheDocument();
  });

  it('handles large candidate lists efficiently', () => {
    const largeCampaign = {
      ...mockCampaign,
      candidates: Array.from({ length: 200 }, (_, i) => ({
        id: String(i + 1),
        name: `Candidate ${i + 1}`,
        positionId: String(Math.floor(i / 20) + 1)
      }))
    };

    render(<VotingPage campaign={largeCampaign} />);
    
    act(() => {
      jest.advanceTimersByTime(300);
    });

    performance.mark('testEnd');
    performance.measure('largeListRender', 'testStart', 'testEnd');
    const measure = performance.getEntriesByName('largeListRender')[0];
    
    expect(measure.duration).toBeLessThanOrEqual(300);
  });

  it('updates vote counts within 100ms', async () => {
    const getVoteCounts = jest.fn().mockResolvedValue({
      '1': { '1': 5, '2': 3 }
    });

    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn(),
      getVoteCounts
    });

    render(<VotingPage campaign={mockCampaign} />);

    performance.mark('updateStart');
    await act(async () => {
      await getVoteCounts('1', '1');
      jest.advanceTimersByTime(100);
    });
    performance.mark('updateEnd');
    
    performance.measure('voteUpdate', 'updateStart', 'updateEnd');
    const measure = performance.getEntriesByName('voteUpdate')[0];
    
    expect(measure.duration).toBeLessThanOrEqual(100);
  });

  it('maintains responsive UI during vote submission', async () => {
    const submitVote = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(resolve, 2000);
      });
    });

    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote,
      getVoteCounts: jest.fn()
    });

    render(<VotingPage campaign={mockCampaign} />);

    performance.mark('submitStart');
    const submitPromise = submitVote('1', '1', '1');
    
    // UI should still be responsive during submission
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeEnabled();

    await act(async () => {
      await submitPromise;
    });
    
    performance.mark('submitEnd');
    performance.measure('voteSubmit', 'submitStart', 'submitEnd');
  });

  it('handles concurrent vote submissions efficiently', async () => {
    const submitVote = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(resolve, 500);
      });
    });

    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote,
      getVoteCounts: jest.fn()
    });

    render(<VotingPage campaign={mockCampaign} />);

    performance.mark('concurrentStart');
    const submissions = Array.from({ length: 5 }, (_, i) => 
      submitVote('1', String(i + 1), '1')
    );

    await act(async () => {
      await Promise.all(submissions);
    });

    performance.mark('concurrentEnd');
    performance.measure('concurrentSubmissions', 'concurrentStart', 'concurrentEnd');
    const measure = performance.getEntriesByName('concurrentSubmissions')[0];
    
    // Should complete all submissions within 600ms (allowing 100ms overhead)
    expect(measure.duration).toBeLessThanOrEqual(600);
  });
});