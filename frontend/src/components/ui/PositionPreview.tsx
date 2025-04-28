import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Position } from '@/lib/types/campaign';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface PositionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  positions: Omit<Position, 'id' | 'exists'>[];
  isLoading?: boolean;
}

export default function PositionPreview({
  isOpen,
  onClose,
  onConfirm,
  positions,
  isLoading = false
}: PositionPreviewProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={handleClose}
    >
      <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-lg bg-background flex flex-col max-h-[90vh]">
        <div className="p-6 flex-shrink-0 border-b border-border">
          <Dialog.Title className="text-xl font-semibold text-foreground flex items-center gap-3">
            {!isLoading && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 hover:bg-muted"
              >
                <ArrowLeftIcon className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            Review Positions ({positions.length})
          </Dialog.Title>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the positions below before adding them to your campaign. These positions will be available for candidate registration.
          </p>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(65vh - 120px)' }}>
          {positions.map((position, index) => (
            <div key={index} className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <CheckBadgeIcon className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-medium text-foreground">{position.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{position.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 flex-shrink-0 border-t border-border mt-auto">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-primary-500 font-medium"
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 text-black font-semibold"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding Positions...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Confirm & Add {positions.length} Position{positions.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}