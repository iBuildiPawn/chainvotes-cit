'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  colorClass?: string;
  showPercentage?: boolean;
  height?: string;
}

export function ProgressBar({ 
  progress, 
  colorClass = 'bg-primary-500',
  showPercentage = false,
  height = 'h-2'
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Animate progress after mount
    requestAnimationFrame(() => {
      setWidth(progress);
    });
  }, [progress]);

  return (
    <div className={`w-full ${height} bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden`}>
      <div
        className={`${colorClass} h-full transition-all duration-500 ease-out rounded-full`}
        style={{ width: `${width}%` }}
      >
        {showPercentage && (
          <span className="sr-only">{Math.round(progress)}% Complete</span>
        )}
      </div>
    </div>
  );
}