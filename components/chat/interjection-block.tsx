'use client';

import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface InterjectionBlockProps {
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  agentColour?: string;
  content: string;
}

export function InterjectionBlock({
  agentName,
  agentRole,
  agentAvatar,
  agentColour,
  content,
}: InterjectionBlockProps) {
  return (
    <div
      className={cn(
      'ml-11 mt-3 min-w-0 rounded-xl border border-l-4 border-border/60 bg-muted/40 p-3',
      'relative before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-border/40',
    )}
      style={agentColour ? { borderLeftColor: agentColour } : undefined}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm">{agentAvatar}</span>
        <span className="text-xs font-semibold">{agentName}</span>
        <span
          className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={agentColour ? { borderColor: agentColour, color: agentColour } : undefined}
        >
          Interjection
        </span>
        <span className="text-xs text-muted-foreground">/ {agentRole}</span>
      </div>
      <div className="pl-0">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
