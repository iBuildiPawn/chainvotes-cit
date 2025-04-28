'use client';

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <span 
          className={`absolute inset-0 transform transition-transform duration-500 ease-in-out ${
            theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          }`}
        >
          <MoonIcon className="h-5 w-5 text-foreground" />
        </span>
        <span 
          className={`absolute inset-0 transform transition-transform duration-500 ease-in-out ${
            theme === 'dark' ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
          }`}
        >
          <SunIcon className="h-5 w-5 text-foreground" />
        </span>
      </div>
    </Button>
  );
}