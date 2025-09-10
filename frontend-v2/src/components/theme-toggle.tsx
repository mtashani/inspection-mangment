'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="h-8 w-8 transition-all duration-500 hover:bg-accent hover:scale-110 active:scale-95"
      title={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
    >
      <div className="relative w-4 h-4">
        {/* Sun Icon */}
        <Sun 
          className={`absolute inset-0 h-4 w-4 transition-all duration-500 ${
            isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`} 
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`absolute inset-0 h-4 w-4 transition-all duration-500 ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
      <span className="sr-only">تغییر تم</span>
    </Button>
  );
}