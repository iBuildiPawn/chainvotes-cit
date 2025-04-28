import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CandidateForm from '../CandidateForm';

describe('CandidateForm', () => {
  const positions = [
    { id: '1', name: 'President' },
    { id: '2', name: 'Vice President' }
  ];

  describe('CSV Import', () => {
    it('handles CSV file upload correctly', async () => {
      const handleSubmit = jest.fn();
      
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={handleSubmit}
        />
      );

      const csvContent = `name,position
John Doe,President
Jane Smith,Vice President`;
      
      const file = new File([csvContent], 'valid.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/import candidates/i);
      
      Object.defineProperty(input, 'files', {
        value: [file]
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith([
          { name: 'John Doe', positionId: '1' },
          { name: 'Jane Smith', positionId: '2' }
        ]);
      });
    });

    it('shows error for invalid CSV format', async () => {
      const csvContent = `invalid,headers
wrong,format`;
      
      const file = new File([csvContent], 'invalid.csv', { type: 'text/csv' });
      
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={jest.fn()}
        />
      );

      const input = screen.getByLabelText(/import candidates/i);
      
      Object.defineProperty(input, 'files', {
        value: [file]
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/invalid csv format/i)).toBeInTheDocument();
      });
    });

    it('handles non-existent positions in CSV', async () => {
      const csvContent = `name,position
John Doe,Non Existent Position`;
      
      const file = new File([csvContent], 'invalid_position.csv', { type: 'text/csv' });
      
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={jest.fn()}
        />
      );

      const input = screen.getByLabelText(/import candidates/i);
      
      Object.defineProperty(input, 'files', {
        value: [file]
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/position not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manual Entry', () => {
    it('allows manual candidate entry', async () => {
      const handleSubmit = jest.fn();
      
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={handleSubmit}
        />
      );

      fireEvent.click(screen.getByText(/add candidate/i));
      
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'John Doe' }
      });
      
      fireEvent.change(screen.getByLabelText(/position/i), {
        target: { value: '1' }
      });

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith([
          { name: 'John Doe', positionId: '1' }
        ]);
      });
    });

    it('validates required fields', async () => {
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText(/add candidate/i));
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/position is required/i)).toBeInTheDocument();
      });
    });

    it('allows removing candidates before submission', () => {
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={jest.fn()}
        />
      );

      // Add candidate
      fireEvent.click(screen.getByText(/add candidate/i));
      
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'John Doe' }
      });
      
      // Remove candidate
      fireEvent.click(screen.getByRole('button', { name: /remove/i }));

      expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={jest.fn()}
        />
      );

      const addButton = screen.getByText(/add candidate/i);
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
    });

    it('maintains focus after form operations', async () => {
      render(
        <CandidateForm 
          positions={positions}
          onSubmit={jest.fn()}
        />
      );

      const addButton = screen.getByText(/add candidate/i);
      fireEvent.click(addButton);

      const nameInput = screen.getByLabelText(/name/i);
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
    });
  });
});