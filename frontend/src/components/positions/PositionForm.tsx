'use client';

import { useState, useCallback, useMemo } from 'react';
import { Position } from '@/lib/types/campaign';
import { Button } from '@/components/ui/Button';
import { TrashIcon, PlusIcon, PlusCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import PositionPreview from '@/components/ui/PositionPreview';
import { GasEstimator } from '@/components/ui/GasEstimator';

// Predefined positions grouped by level
const PREDEFINED_POSITIONS = {
  'National': [
    { name: 'President', description: 'Head of state and government. Serves a six-year term.' },
    { name: 'Vice President', description: 'Supports the President and may assume the presidency if necessary. Serves a six-year term.' },
    { name: 'Senator', description: 'Member of the Senate, representing the nation at large. Serves a six-year term.' },
    { name: 'District Representative', description: 'Member of the House of Representatives, representing a legislative district.' },
    { name: 'Party-list Representative', description: 'Member of the House of Representatives, representing marginalized sectors.' }
  ],
  'Regional': [
    { name: 'BARMM Parliament Member', description: 'Member of the Bangsamoro Parliament, representing constituencies within BARMM.' }
  ],
  'Provincial': [
    { name: 'Governor', description: 'Chief executive of the province.' },
    { name: 'Vice Governor', description: 'Assists the governor and presides over the Provincial Board.' },
    { name: 'Provincial Board Member', description: 'Member of the Sangguniang Panlalawigan, creating policies for the province.' }
  ],
  'City': [
    { name: 'City Mayor', description: 'Chief executive of the city.' },
    { name: 'City Vice Mayor', description: 'Assists the mayor and presides over the City Council.' },
    { name: 'City Councilor', description: 'Member of the Sangguniang Panlungsod, creating policies for the city.' }
  ],
  'Municipal': [
    { name: 'Municipal Mayor', description: 'Chief executive of the municipality.' },
    { name: 'Municipal Vice Mayor', description: 'Assists the mayor and presides over the Municipal Council.' },
    { name: 'Municipal Councilor', description: 'Member of the Sangguniang Bayan, creating policies for the municipality.' }
  ],
  'Barangay': [
    { name: 'Barangay Captain', description: 'Chief executive of the barangay (Punong Barangay).' },
    { name: 'Barangay Councilor', description: 'Member of the Sangguniang Barangay (Kagawad), legislating at the barangay level.' }
  ],
  'Youth Council': [
    { name: 'SK Chairman', description: 'Leader of the Sangguniang Kabataan (Youth Council) in the barangay.' },
    { name: 'SK Councilor', description: 'Member of the youth council focusing on youth-related policies and projects.' }
  ]
};

export interface PositionFormProps {
  campaignId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  onSubmit: (positions: PositionInput[]) => void;
}

interface PositionInput {
  name: string;
  description: string;
}

export default function PositionForm({ campaignId, onSubmit, onCancel }: PositionFormProps) {
  const [positions, setPositions] = useState<PositionInput[]>([]);
  const [error, setError] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGasEstimate, setShowGasEstimate] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState(false);

  // Gas estimation args
  const gasEstimationArgs = useMemo(() => {
    // Handle the case when campaignId is undefined
    if (!campaignId) {
      return [BigInt(0), positions];
    }
    return [BigInt(campaignId), positions];
  }, [campaignId, positions]);

  const handleAddPosition = () => {
    setPositions(prev => [...prev, { name: '', description: '' }]);
    setError('');
  };

  const handleRemovePosition = (index: number) => {
    setPositions(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleAddPredefinedPosition = (position: PositionInput) => {
    if (positions.some(p => p.name.toLowerCase() === position.name.toLowerCase())) {
      setError('This position has already been added');
      return;
    }
    setPositions(prev => [...prev, position]);
    setError('');
  };

  const isPositionSelected = (positionName: string) => {
    return positions.some(p => p.name.toLowerCase() === positionName.toLowerCase());
  };

  const handleOptimize = useCallback(() => {
    setOptimizationMode(true);
    // Split positions into smaller batches if there are too many
    if (positions.length > 10) {
      setError('Consider splitting these positions into separate transactions to reduce gas costs');
    }
  }, [positions.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (positions.length === 0) {
      setError('At least one position is required');
      return;
    }

    const hasEmpty = positions.some(p => !p.name.trim() || !p.description.trim());
    if (hasEmpty) {
      setError('All position fields must be filled');
      return;
    }

    // Show gas estimate before proceeding to preview if there are many positions
    if (positions.length > 5 && !showGasEstimate) {
      setShowGasEstimate(true);
      return;
    }

    setIsPreviewOpen(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(positions);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Predefined Positions Section */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-start gap-2 mb-6">
            <InformationCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Common Positions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose from predefined positions below or add custom positions. Selected positions cannot be modified once the campaign starts.
              </p>
              {positions.length > 5 && (
                <p className="text-xs text-warning mt-1">
                  Adding many positions in a single transaction may result in higher gas costs.
                </p>
              )}
            </div>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PREDEFINED_POSITIONS).map(([category, categoryPositions]) => (
              <div key={category} className="bg-card p-4 rounded-md shadow-sm border border-border">
                <h4 className="text-base font-medium text-foreground mb-3">{category}</h4>
                <ul className="space-y-2">
                  {categoryPositions.map((position) => {
                    const selected = isPositionSelected(position.name);
                    return (
                      <li key={position.name}>
                        <button
                          type="button"
                          onClick={() => handleAddPredefinedPosition(position)}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center gap-2 group transition
                            ${selected 
                              ? 'bg-primary/10 text-primary' 
                              : 'text-foreground hover:bg-muted'}`}
                          title={selected ? 'Already added to your campaign' : position.description}
                          disabled={selected}
                        >
                          {selected ? (
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <PlusCircleIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                          )}
                          <div className="flex-1">
                            <span className="font-medium">{position.name}</span>
                            {selected && (
                              <span className="ml-1 text-xs text-primary">• Added</span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Gas estimator component - show when there are many positions */}
        {positions.length > 0 && (
          <GasEstimator 
            functionName="addPositions"
            args={gasEstimationArgs}
            isActive={showGasEstimate || positions.length > 10}
            onOptimize={handleOptimize}
          />
        )}

        {/* Optimization mode warning */}
        {optimizationMode && positions.length > 10 && (
          <div className="rounded-md bg-warning/10 p-4 border border-warning/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-warning" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-foreground">Gas Optimization Recommended</h3>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    Adding many positions at once ({positions.length}) may result in high gas costs or transaction failures.
                    Consider these options:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Submit with fewer positions (5-10 is optimal)</li>
                    <li>Split into multiple transactions</li>
                    <li>Try during lower gas price periods</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Positions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Your Selected Positions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review and edit your positions before adding them to the campaign
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPosition}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Custom Position
            </Button>
          </div>

          {/* Position count indicator */}
          {positions.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className={positions.length > 10 ? 'text-warning font-medium' : ''}>
                  {positions.length} position{positions.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              {positions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPositions([])}
                  className="text-xs text-muted-foreground hover:text-error transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {positions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed border-border">
              <PlusCircleIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No positions added</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add positions using the options above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position, index) => (
                <div key={index} className="form-container relative">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="form-group">
                      <label htmlFor={`name-${index}`} className="required">
                        Position Name
                      </label>
                      <input
                        type="text"
                        id={`name-${index}`}
                        value={position.name}
                        onChange={(e) => {
                          const updatedPositions = [...positions];
                          updatedPositions[index].name = e.target.value;
                          setPositions(updatedPositions);
                          setError('');
                        }}
                        className="form-input"
                        placeholder="e.g., President, Secretary"
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`description-${index}`} className="required">
                        Description
                      </label>
                      <textarea
                        id={`description-${index}`}
                        value={position.description}
                        onChange={(e) => {
                          const updatedPositions = [...positions];
                          updatedPositions[index].description = e.target.value;
                          setPositions(updatedPositions);
                          setError('');
                        }}
                        className="form-input"
                        placeholder="Describe the responsibilities and requirements for this position"
                        required
                        rows={3}
                        minLength={10}
                        maxLength={500}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePosition(index)}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-error/10 p-4 border border-error/20">
            <p className="text-sm font-medium text-error">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-border">
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
            disabled={positions.length === 0}
          >
            {showGasEstimate && positions.length > 5 ? 'Continue to Review' : 'Review Positions'}
          </Button>
        </div>
      </form>

      <PositionPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirm}
        positions={positions}
        isLoading={isSubmitting}
      />
    </>
  );
}