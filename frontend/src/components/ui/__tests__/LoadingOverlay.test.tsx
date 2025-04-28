import { render, screen } from '@testing-library/react';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders when loading is true', () => {
    render(<LoadingOverlay loading={true}>Content</LoadingOverlay>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows children when not loading', () => {
    render(<LoadingOverlay loading={false}>Content</LoadingOverlay>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles transaction hash display', () => {
    render(
      <LoadingOverlay loading={true} transactionHash="0x123">
        Content
      </LoadingOverlay>
    );
    expect(screen.getByText(/0x123/)).toBeInTheDocument();
  });

  it('shows progress when provided', () => {
    render(
      <LoadingOverlay loading={true} progress={50}>
        Content
      </LoadingOverlay>
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('preserves children accessibility when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <button aria-label="test">Click me</button>
      </LoadingOverlay>
    );
    expect(screen.getByLabelText('test')).toBeInTheDocument();
  });

  it('handles multiple children correctly', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>Child 1</div>
        <div>Child 2</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('applies blur effect to content when loading', () => {
    render(<LoadingOverlay loading={true}>Content</LoadingOverlay>);
    const container = screen.getByTestId('loading-overlay-content');
    expect(container).toHaveClass('blur-sm');
  });
});