'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { InterjectionBlock } from './interjection-block';
import { parseResponse } from '@/lib/orchestrator/parse-interjections';
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
        <div className="text-center space-y-4 max-w-xl px-4">
          <Image
            src="/thecouncil.png"
            alt="The Council"
            width={1200}
            height={280}
            priority
            className="h-auto w-full dark:invert dark:mix-blend-screen"
          />
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

          if (message.role === 'assistant') {
            const { primaryContent, interjections } = parseResponse(textContent);

            return (
              <div key={message.id}>
                <MessageBubble
                  role="assistant"
                  content={primaryContent}
                  agentName={primaryAgent?.name}
                  agentAvatar={primaryAgent?.avatar}
                  agentColour={primaryAgent?.colour}
                  isStreaming={isLast && isStreaming && interjections.length === 0}
                />
                {interjections.map((interjection, i) => (
                  <InterjectionBlock
                    key={`${message.id}-interjection-${i}`}
                    agentName={interjection.agentName}
                    agentRole={interjection.agentRole}
                    agentAvatar={interjection.agentAvatar}
                    content={interjection.content}
                  />
                ))}
              </div>
            );
          }

          return (
            <MessageBubble
              key={message.id}
              role="user"
              content={textContent}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
