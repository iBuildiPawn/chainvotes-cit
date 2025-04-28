import { render, screen, fireEvent } from '@testing-library/react';
import VotePreview from '../VotePreview';

describe('VotePreview', () => {
  const mockCampaign = {
    id: '1',
    title: 'Test Campaign',
    positions: [
      { id: '1', name: 'Position 1' }
    ],
    candidates: [
      { id: '1', name: 'Candidate 1', positionId: '1' }
    ]
  };

  const mockSelectedVotes = {
    '1': '1' // positionId: candidateId
  };

  it('displays all selected votes correctly', () => {
    render(
      <VotePreview 
        campaign={mockCampaign}
        selectedVotes={mockSelectedVotes}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    expect(screen.getByText('Position 1')).toBeInTheDocument();
    expect(screen.getByText('Candidate 1')).toBeInTheDocument();
  });

  it('handles empty votes list', () => {
    render(
      <VotePreview 
        campaign={mockCampaign}
        selectedVotes={{}}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    expect(screen.getByText('No votes selected')).toBeInTheDocument();
  });

  it('disables confirm button when loading', () => {
    render(
      <VotePreview 
        campaign={mockCampaign}
        selectedVotes={mockSelectedVotes}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        loading={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = jest.fn();
    render(
      <VotePreview 
        campaign={mockCampaign}
        selectedVotes={mockSelectedVotes}
        onConfirm={handleConfirm}
        onCancel={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = jest.fn();
    render(
      <VotePreview 
        campaign={mockCampaign}
        selectedVotes={mockSelectedVotes}
        onConfirm={jest.fn()}
        onCancel={handleCancel}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleCancel).toHaveBeenCalled();
  });

  it('shows gas estimation when available', () => {
    render(
      <VotePreview 
        campaign={mockCampaign}
        selectedVotes={mockSelectedVotes}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        gasEstimate="0.001 ETH"
      />
    );
    
    expect(screen.getByText(/0\.001 ETH/)).toBeInTheDocument();
  });

  it('validates vote completeness', () => {
    render(
      <VotePreview 
        campaign={{
          ...mockCampaign,
          positions: [
            { id: '1', name: 'Position 1' },
            { id: '2', name: 'Position 2' }
          ]
        }}
        selectedVotes={mockSelectedVotes} // Only voting for position 1
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    expect(screen.getByText(/not all positions selected/i)).toBeInTheDocument();
  });

  it('shows transaction summary for multiple votes', () => {
    render(
      <VotePreview 
        campaign={{
          ...mockCampaign,
          positions: [
            { id: '1', name: 'Position 1' },
            { id: '2', name: 'Position 2' }
          ],
          candidates: [
            { id: '1', name: 'Candidate 1', positionId: '1' },
            { id: '2', name: 'Candidate 2', positionId: '2' }
          ]
        }}
        selectedVotes={{
          '1': '1',
          '2': '2'
        }}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    expect(screen.getByText('Position 1')).toBeInTheDocument();
    expect(screen.getByText('Position 2')).toBeInTheDocument();
    expect(screen.getByText('Candidate 1')).toBeInTheDocument();
    expect(screen.getByText('Candidate 2')).toBeInTheDocument();
  });
});