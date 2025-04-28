import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import CampaignLayout from '../layout';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

jest.mock('@/lib/hooks/useVoting', () => ({
  useVoting: jest.fn().mockReturnValue({
    isVotingAllowed: true,
    hasUserVoted: false,
  })
}));

describe('Campaign Navigation', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    pathname: '/campaigns/1'
  };

  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    description: 'Test Description',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
  });

  it('renders navigation tabs correctly', () => {
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    expect(screen.getByText('Vote')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('navigates to vote page when vote tab is clicked', () => {
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    fireEvent.click(screen.getByText('Vote'));
    expect(mockRouter.push).toHaveBeenCalledWith('/campaigns/1/vote');
  });

  it('navigates to results page when results tab is clicked', () => {
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    fireEvent.click(screen.getByText('Results'));
    expect(mockRouter.push).toHaveBeenCalledWith('/campaigns/1/results');
  });

  it('handles back navigation', () => {
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('shows active tab based on current route', () => {
    mockRouter.pathname = '/campaigns/1/vote';
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    expect(screen.getByText('Vote').closest('button')).toHaveClass('bg-primary');
  });

  it('maintains campaign context during navigation', async () => {
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    
    fireEvent.click(screen.getByText('Results'));
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/campaigns/1/results');
    });

    fireEvent.click(screen.getByText('Vote'));
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/campaigns/1/vote');
    });
  });

  it('preserves campaign ID in navigation', () => {
    (useParams as jest.Mock).mockReturnValue({ id: '2' });
    render(<CampaignLayout>{mockCampaign.title}</CampaignLayout>);
    
    fireEvent.click(screen.getByText('Vote'));
    expect(mockRouter.push).toHaveBeenCalledWith('/campaigns/2/vote');
  });

  it('disables navigation during loading states', () => {
    render(
      <CampaignLayout loading={true}>{mockCampaign.title}</CampaignLayout>
    );
    
    fireEvent.click(screen.getByText('Vote'));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows error state in navigation', () => {
    render(
      <CampaignLayout error="Campaign not found">{mockCampaign.title}</CampaignLayout>
    );
    expect(screen.getByText('Campaign not found')).toBeInTheDocument();
  });
});