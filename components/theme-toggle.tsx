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
  const label = nextTheme === 'light' ? 'Switch to light mode' : 'Switch to dark mode';
  const isDark = resolvedTheme === 'dark';

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(nextTheme)}
        className={cn('mx-auto flex', className)}
        title={label}
        aria-label={label}
      >
        <ThemeIcon isDark={isDark} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(nextTheme)}
      className={cn('w-full justify-start gap-2 text-xs', className)}
      title={label}
      aria-label={label}
    >
      <ThemeIcon isDark={isDark} />
      <span className="transition-opacity duration-200">
        {isDark ? 'Light mode' : 'Dark mode'}
      </span>
    </Button>
  );
}

function ThemeIcon({ isDark }: { isDark: boolean }) {
  return (
    <span className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <Sun
        className={cn(
          'absolute h-3.5 w-3.5 transition-all duration-300 ease-out',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
        )}
      />
      <Moon
        className={cn(
          'absolute h-3.5 w-3.5 transition-all duration-300 ease-out',
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
    </span>
  );
}
