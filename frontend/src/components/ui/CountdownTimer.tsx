import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        // Timer completed
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Check if timer completed
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onComplete]);
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Voting begins in</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-md w-16 h-16 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">{timeLeft.days}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Days</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-md w-16 h-16 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">{timeLeft.hours}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Hours</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-md w-16 h-16 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">{timeLeft.minutes}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Minutes</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-md w-16 h-16 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">{timeLeft.seconds}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Seconds</span>
        </div>
      </div>
    </div>
  );
} 