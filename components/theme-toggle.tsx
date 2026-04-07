'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="w-full justify-start text-xs"
    >
      {resolvedTheme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
    </Button>
  );
}
