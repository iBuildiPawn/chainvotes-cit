import { Position, Candidate, Campaign } from '@/lib/types/campaign';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface VotePreviewProps {
  campaign: Campaign;
  selectedVotes: Record<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function VotePreview({ 
  campaign, 
  selectedVotes, 
  onConfirm, 
  onCancel,
  loading = false
}: VotePreviewProps) {
  const votes = Object.entries(selectedVotes).map(([positionId, candidateId]) => {
    const position = campaign.positions.find(p => p.id === positionId);
    const candidate = campaign.candidates.find(c => c.id === candidateId);
    if (!position || !candidate) return null;
    return { position, candidate };
  }).filter(Boolean);

  // Check if all positions have votes
  const allPositionsVoted = campaign.positions.every(position => 
    Object.keys(selectedVotes).includes(position.id)
  );

  return (
    <Dialog isOpen={true} onClose={onCancel}>
      <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-card-background p-6 shadow-xl w-full border border-card-border">
        <Dialog.Title className="text-xl font-semibold text-card-foreground mb-4">
          Review Your Votes
        </Dialog.Title>
        
        <div className="space-y-4">
          {votes.length === 0 ? (
            <div className="text-center py-4">
              <XCircleIcon className="h-12 w-12 text-error-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No votes selected</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {votes.map(vote => vote && (
                  <div key={vote.position.id} className="flex justify-between items-center py-3 px-4 border-b border-border last:border-b-0 bg-muted rounded-md">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{vote.position.name}</p>
                      <p className="text-sm text-muted-foreground">{vote.candidate.name}</p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-primary-500" />
                  </div>
                ))}
              </div>
              
              {!allPositionsVoted && (
                <div className="text-sm text-primary-500 bg-muted p-3 rounded-md border border-primary-500/20">
                  <p>Note: You have not selected votes for all positions.</p>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p>By confirming, you'll submit your votes to the blockchain. This action cannot be undone.</p>
              </div>
            </>
          )}
          
          <div className="mt-5 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={onConfirm}
              disabled={votes.length === 0 || loading}
              type="button"
              className="relative"
            >
              {loading ? (
                <>
                  <span className="opacity-0">Confirm Votes</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full border-2 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  </span>
                </>
              ) : (
                'Confirm Votes'
              )}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}