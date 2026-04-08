'use client';

import { MarkdownRenderer } from './markdown-renderer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  agentAvatar?: string;
  agentColour?: string;
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  agentName,
  agentAvatar,
  agentColour,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 py-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback
            className="text-sm"
            style={agentColour ? { backgroundColor: agentColour, color: 'white' } : undefined}
          >
            {agentAvatar || '🤖'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[80%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        {!isUser && agentName && (
          <p className="text-xs font-medium text-muted-foreground">{agentName}</p>
        )}
        <div
          className={cn(
            'px-4 py-2.5 shadow-sm',
            isUser
              ? 'rounded-[1.6rem] bg-primary/90 text-primary-foreground ring-1 ring-primary/20'
              : 'rounded-2xl bg-muted'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownRenderer content={content} />
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
          )}
        </div>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-sm bg-primary text-primary-foreground">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
