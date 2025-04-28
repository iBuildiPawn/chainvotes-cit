import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CampaignLayout from '../layout';
import VotingPage from '../vote/page';
import ResultsPage from '../results/page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    back: jest.fn()
  }),
  useParams: jest.fn().mockReturnValue({ id: '1' })
}));

jest.mock('@/lib/hooks/useVoting', () => ({
  useVoting: jest.fn().mockReturnValue({
    isVotingAllowed: true,
    hasUserVoted: false,
    submitVote: jest.fn(),
    getVoteCounts: jest.fn()
  })
}));

jest.mock('@/lib/hooks/useCampaigns', () => ({
  useCampaigns: jest.fn().mockReturnValue({
    campaigns: [{
      id: '1',
      title: 'Test Campaign',
      description: 'Test Description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      positions: [{ id: '1', name: 'Position 1' }],
      candidates: [{ id: '1', name: 'Candidate 1', positionId: '1' }]
    }]
  })
}));

describe('Accessibility Tests', () => {
  it('campaign layout meets WCAG standards', async () => {
    const { container } = render(
      <CampaignLayout>
        <div>Test Content</div>
      </CampaignLayout>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('voting page meets WCAG standards', async () => {
    const { container } = render(<VotingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('maintains focus management during navigation', () => {
    render(<CampaignLayout>Test Content</CampaignLayout>);
    const backButton = screen.getByLabelText('Go back');
    backButton.focus();
    expect(document.activeElement).toBe(backButton);
  });

  it('has proper heading structure', () => {
    render(<CampaignLayout>Test Content</CampaignLayout>);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].tagName).toBe('H1');
  });

  it('provides sufficient color contrast', async () => {
    const { container } = render(<CampaignLayout>Test Content</CampaignLayout>);
    const results = await axe(container);
    const contrastViolations = results.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    expect(contrastViolations).toHaveLength(0);
  });

  it('ensures proper aria-labels on interactive elements', () => {
    render(<CampaignLayout>Test Content</CampaignLayout>);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName();
    });
  });

  it('supports keyboard navigation in tabs', () => {
    render(<CampaignLayout>Test Content</CampaignLayout>);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('tabIndex');
    });
  });

  it('announces loading states to screen readers', () => {
    render(
      <CampaignLayout loading={true}>
        Test Content
      </CampaignLayout>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/loading/i);
  });

  it('announces error states to screen readers', () => {
    render(
      <CampaignLayout error="Error loading campaign">
        Test Content
      </CampaignLayout>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/error/i);
  });

  it('has appropriate landmark regions', () => {
    render(<CampaignLayout>Test Content</CampaignLayout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});