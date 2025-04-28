'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  // Keeping a minimal context that doesn't include toggle functionality
  theme: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'black-yellow',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Add preload class to prevent transitions on page load
    document.documentElement.classList.add('preload');
    
    // Remove preload class after a short delay to enable transitions
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('preload');
      setMounted(true);
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Prevent theme flash by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: 'black-yellow' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}