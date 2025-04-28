'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Candidate, Position } from '@/lib/types/campaign';
import { Button } from '@/components/ui/Button';
import { PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

export interface CandidateFormProps {
  campaignId: string;
  positions: Position[];
  onCancel?: () => void;
  onSuccess?: () => void;
  onSubmit: (candidates: CandidateInput[]) => void;
}

interface CandidateInput {
  name: string;
  bio: string;
  imageUrl?: string;
  positionId: string;
}

export default function CandidateForm({ campaignId, positions, onSubmit, onCancel }: CandidateFormProps) {
  // Debug logging for positions prop
  useEffect(() => {
    console.log('CandidateForm received positions:', positions);
    if (!positions || positions.length === 0) {
      console.warn('No positions provided to CandidateForm');
    }
  }, [positions]);

  // Ensure positions is always an array, even if it's undefined
  const safePositions = positions || [];
  
  const [candidates, setCandidates] = useState<CandidateInput[]>([{
    name: '',
    bio: '',
    imageUrl: '',
    positionId: safePositions.length > 0 ? safePositions[0].id : ''
  }]);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update candidates when positions change
  useEffect(() => {
    if (safePositions.length > 0 && candidates.some(c => !c.positionId)) {
      setCandidates(prev => prev.map(candidate => ({
        ...candidate,
        positionId: candidate.positionId || safePositions[0].id
      })));
    }
  }, [safePositions]);

  const handleCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddCandidate = () => {
    setCandidates(prev => [...prev, {
      name: '',
      bio: '',
      imageUrl: '',
      positionId: safePositions.length > 0 ? safePositions[0].id : ''
    }]);
    setError('');
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all candidates
    const hasEmptyFields = candidates.some(c => !c.name || !c.bio || !c.positionId);
    if (hasEmptyFields) {
      setError('All fields except image URL are required for each candidate');
      return;
    }

    // Validate that positions exist
    if (safePositions.length === 0) {
      setError('No positions available. Please add positions before adding candidates.');
      return;
    }

    onSubmit(candidates);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const rows = csvContent.split('\n').filter(row => row.trim());
        
        // Parse header row and map to field names
        const headerRow = rows[0].toLowerCase().split(',').map(h => h.trim());
        const requiredFields = ['name', 'bio', 'imageurl', 'position'];
        const fieldIndices: { [key: string]: number } = {};

        // Validate header fields
        for (const field of requiredFields) {
          const index = headerRow.indexOf(field);
          if (index === -1) {
            throw new Error(`Missing required column: ${field}`);
          }
          fieldIndices[field] = index;
        }

        // Parse data rows
        const candidatesFromCSV = rows.slice(1).map((row, rowIndex) => {
          const fields = row.split(',').map(field => field.trim());
          
          // Skip empty rows
          if (fields.every(f => !f)) return null;

          const name = fields[fieldIndices.name];
          const bio = fields[fieldIndices.bio];
          const imageUrl = fields[fieldIndices.imageurl];
          const positionName = fields[fieldIndices.position];

          if (!name || !bio || !positionName) {
            throw new Error(`Row ${rowIndex + 2}: Name, Bio, and Position are required fields`);
          }

          const position = safePositions.find(p => p.name.toLowerCase() === positionName.toLowerCase());
          if (!position) {
            throw new Error(`Row ${rowIndex + 2}: Position not found: ${positionName}`);
          }
          
          return {
            name,
            bio,
            imageUrl: imageUrl || '',
            positionId: position.id
          };
        }).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);

        if (candidatesFromCSV.length === 0) {
          throw new Error('No valid candidates found in CSV');
        }

        setCandidates(candidatesFromCSV);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid CSV format. Please use the template: Name, Bio, ImageURL, Position');
      }
    };
    reader.readAsText(file);
  };

  // If no positions are available, show a message
  if (safePositions.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md text-center">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">No Positions Available</h3>
        <p className="text-yellow-700 mb-4">
          You need to add positions before you can add candidates. Please go to the "Add Positions" tab first.
        </p>
        <p className="text-sm text-yellow-600">
          If you've already added positions but they're not showing up, try refreshing the page or checking the blockchain connection.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCandidate}
          className="flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" />
          Add Candidate
        </Button>

        <div className="flex flex-col items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            accept=".csv"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCSVClick}
            className="flex items-center gap-1"
            title="Import candidates from CSV"
          >
            Import CSV
          </Button>
          <div className="flex items-center mt-1 gap-2">
            <a 
              href="/sample_candidates.csv" 
              download
              className="text-xs text-primary hover:text-primary-400"
            >
              Download template
            </a>
            {error && (
              <span className="text-xs text-muted-foreground">← Use this template format</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-error/10 p-4 mb-4 border border-error/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {candidates.map((candidate, index) => (
          <div key={index} className="form-container space-y-4 relative">
            <div className="grid grid-cols-1 gap-4">
              <div className="form-group">
                <label htmlFor={`name-${index}`} className="required">
                  Name
                </label>
                <input
                  type="text"
                  id={`name-${index}`}
                  value={candidate.name}
                  onChange={(e) => {
                    const updated = [...candidates];
                    updated[index].name = e.target.value;
                    setCandidates(updated);
                    setError('');
                  }}
                  className="form-input"
                  placeholder="Candidate Name"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor={`position-${index}`} className="required">
                  Position
                </label>
                <select
                  id={`position-${index}`}
                  value={candidate.positionId}
                  onChange={(e) => {
                    const updated = [...candidates];
                    updated[index].positionId = e.target.value;
                    setCandidates(updated);
                    setError('');
                  }}
                  className="form-input"
                  required
                >
                  {safePositions.length === 0 ? (
                    <option value="">No positions available</option>
                  ) : (
                    safePositions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={`bio-${index}`} className="required">
                  Bio
                </label>
                <textarea
                  id={`bio-${index}`}
                  value={candidate.bio}
                  onChange={(e) => {
                    const updated = [...candidates];
                    updated[index].bio = e.target.value;
                    setCandidates(updated);
                    setError('');
                  }}
                  className="form-input"
                  placeholder="Candidate Bio"
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor={`imageUrl-${index}`}>
                  Image URL
                </label>
                <input
                  type="url"
                  id={`imageUrl-${index}`}
                  value={candidate.imageUrl}
                  onChange={(e) => {
                    const updated = [...candidates];
                    updated[index].imageUrl = e.target.value;
                    setCandidates(updated);
                  }}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {candidates.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveCandidate(index)}
                className="absolute top-0 right-0 p-2 text-gray-400 hover:text-error"
                aria-label="Remove candidate"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={candidates.length === 0 || safePositions.length === 0}
        >
          Add {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </form>
  );
}