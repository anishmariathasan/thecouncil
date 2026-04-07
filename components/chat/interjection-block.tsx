'use client';

import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface InterjectionBlockProps {
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  content: string;
}

export function InterjectionBlock({
  agentName,
  agentRole,
  agentAvatar,
  content,
}: InterjectionBlockProps) {
  return (
    <div className={cn(
      'ml-11 mt-3 rounded-xl border border-border/60 bg-muted/40 p-3',
      'relative before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-border/40',
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{agentAvatar}</span>
        <span className="text-xs font-semibold">{agentName}</span>
        <span className="text-xs text-muted-foreground">· {agentRole}</span>
      </div>
      <div className="pl-0">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
