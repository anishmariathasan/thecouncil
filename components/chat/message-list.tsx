'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import type { UIMessage } from 'ai';
import type { AgentConfig } from '@/lib/types/agents';

interface MessageListProps {
  messages: UIMessage[];
  primaryAgent?: AgentConfig;
  isStreaming?: boolean;
}

export function MessageList({ messages, primaryAgent, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <h2 className="text-2xl font-semibold">The Council</h2>
          <p className="text-muted-foreground">
            Start a conversation with your council of AI agents. Configure your agents and API keys in Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-4">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const textContent = message.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('') ?? '';

          return (
            <MessageBubble
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={textContent}
              agentName={message.role === 'assistant' ? primaryAgent?.name : undefined}
              agentAvatar={message.role === 'assistant' ? primaryAgent?.avatar : undefined}
              agentColour={message.role === 'assistant' ? primaryAgent?.colour : undefined}
              isStreaming={isLast && isStreaming && message.role === 'assistant'}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
