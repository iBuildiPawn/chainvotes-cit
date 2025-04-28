import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  onManualOverride?: () => void;
  showManualOverrideAfter?: number; // milliseconds
}

export function LoadingOverlay({ 
  isLoading, 
  message, 
  onManualOverride,
  showManualOverrideAfter = 10000 // Reduced to 10 seconds
}: LoadingOverlayProps) {
  const [showOverrideButton, setShowOverrideButton] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (isLoading && onManualOverride) {
      // Show override button after specified time
      const overrideTimer = setTimeout(() => {
        setShowOverrideButton(true);
      }, showManualOverrideAfter);
      
      // Track elapsed time for user feedback
      const elapsedTimer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => {
        clearTimeout(overrideTimer);
        clearInterval(elapsedTimer);
      };
    } else {
      // Reset elapsed time when not loading
      setElapsedTime(0);
    }
  }, [isLoading, onManualOverride, showManualOverrideAfter]);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]">
      <div className="fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 rounded-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-16 w-16">
            {/* Chain logo spinner */}
            <div className="absolute inset-0 h-full w-full animate-pulse">
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-primary/30">
                <path 
                  d="M10 3v18a8 8 0 1 1-8-8h18a8 8 0 1 0-8 8V3z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                />
              </svg>
            </div>
            
            {/* Rotating spinner */}
            <div className="absolute inset-0 h-full w-full animate-spin" style={{ animationDuration: '2s' }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-primary">
                <path 
                  d="M16.5 18.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeDasharray="6 10" 
                />
              </svg>
            </div>
            
            {/* Inner spinner */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </div>
          
          <h2 className="text-lg font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">Please wait while your transaction is being processed...</p>
          <p className="text-xs text-muted-foreground/70">
            {elapsedTime > 0 && `Elapsed time: ${elapsedTime} seconds. `}
            Do not close this window.
          </p>
          
          {showOverrideButton && onManualOverride && (
            <div className="mt-4 w-full">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-3">
                <p className="text-sm text-amber-800 font-medium">
                  This is taking longer than expected
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Your transaction may have already been confirmed on the blockchain, but our system hasn't detected it yet.
                </p>
              </div>
              <div className="flex space-x-3 justify-center">
                <Button 
                  type="button"
                  onClick={onManualOverride}
                  variant="default"
                  size="default"
                  className="w-full"
                >
                  Continue Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}