import { renderHook, act } from '@testing-library/react';
import useVotingTransitions from '../useVotingTransitions';
import { useVoting } from '@/lib/hooks/useVoting';

jest.mock('@/lib/hooks/useVoting');

describe('useVotingTransitions', () => {
  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    startDate: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    endDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    positions: [
      { id: '1', name: 'Position 1' }
    ],
    candidates: [
      { id: '1', name: 'Candidate 1', positionId: '1' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: jest.fn(),
      getVoteCounts: jest.fn(),
      fetchVoteCounts: jest.fn()
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    expect(result.current.currentStep).toBe('select');
    expect(result.current.selectedVotes).toEqual({});
  });

  it('transitions to preview step when votes are selected', () => {
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    act(() => {
      result.current.handleVoteSelect('1', '1');
      result.current.handlePreviewClick();
    });
    
    expect(result.current.currentStep).toBe('preview');
  });

  it('handles vote selection correctly', () => {
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    act(() => {
      result.current.handleVoteSelect('1', '1');
    });
    
    expect(result.current.selectedVotes['1']).toBe('1');
  });

  it('validates vote completeness', () => {
    const campaignWithMultiplePositions = {
      ...mockCampaign,
      positions: [
        { id: '1', name: 'Position 1' },
        { id: '2', name: 'Position 2' }
      ]
    };
    
    const { result } = renderHook(() => useVotingTransitions(campaignWithMultiplePositions));
    
    act(() => {
      result.current.handleVoteSelect('1', '1'); // Only voting for one position
    });
    
    expect(result.current.isVoteComplete).toBe(false);
  });

  it('handles vote submission', async () => {
    const mockSubmitVote = jest.fn().mockResolvedValue({ hash: '0x123' });
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: mockSubmitVote,
      getVoteCounts: jest.fn(),
      fetchVoteCounts: jest.fn()
    });
    
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    act(() => {
      result.current.handleVoteSelect('1', '1');
    });
    
    await act(async () => {
      await result.current.handleVoteSubmit();
    });
    
    expect(mockSubmitVote).toHaveBeenCalledWith(mockCampaign.id, '1', '1');
    expect(result.current.currentStep).toBe('success');
  });

  it('handles submission errors', async () => {
    const mockError = new Error('Transaction failed');
    const mockSubmitVote = jest.fn().mockRejectedValue(mockError);
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: false,
      submitVote: mockSubmitVote,
      getVoteCounts: jest.fn(),
      fetchVoteCounts: jest.fn()
    });
    
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    act(() => {
      result.current.handleVoteSelect('1', '1');
    });
    
    await act(async () => {
      await result.current.handleVoteSubmit();
    });
    
    expect(result.current.error).toBe(mockError);
    expect(result.current.currentStep).toBe('error');
  });

  it('prevents voting when campaign is ended', () => {
    const endedCampaign = {
      ...mockCampaign,
      endDate: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    };
    
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: false,
      hasUserVoted: false,
      submitVote: jest.fn(),
      getVoteCounts: jest.fn(),
      fetchVoteCounts: jest.fn()
    });
    
    const { result } = renderHook(() => useVotingTransitions(endedCampaign));
    
    expect(result.current.isVotingAllowed).toBe(false);
  });

  it('prevents voting when user has already voted', () => {
    (useVoting as jest.Mock).mockReturnValue({
      isVotingAllowed: true,
      hasUserVoted: true,
      submitVote: jest.fn(),
      getVoteCounts: jest.fn(),
      fetchVoteCounts: jest.fn()
    });
    
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    expect(result.current.hasUserVoted).toBe(true);
  });

  it('resets state when returning to select step', () => {
    const { result } = renderHook(() => useVotingTransitions(mockCampaign));
    
    act(() => {
      result.current.handleVoteSelect('1', '1');
      result.current.handlePreviewClick();
      result.current.handleBackClick();
    });
    
    expect(result.current.currentStep).toBe('select');
    expect(result.current.error).toBeNull();
  });
});