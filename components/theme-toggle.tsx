'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(nextTheme)}
        className={cn('mx-auto flex', className)}
        title={nextTheme === 'light' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={nextTheme === 'light' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(nextTheme)}
      className={cn('w-full justify-start text-xs', className)}
    >
      {resolvedTheme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
    </Button>
  );
}
