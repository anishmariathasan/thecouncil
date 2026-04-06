'use client';

import { useChat } from '@ai-sdk/react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import type { AgentConfig } from '@/lib/types/agents';
import type { SessionConfig } from '@/lib/types/council';

interface ChatContainerProps {
  sessionConfig: SessionConfig;
  primaryAgent?: AgentConfig;
}

export function ChatContainer({ sessionConfig, primaryAgent }: ChatContainerProps) {
  const { messages, status, append } = useChat({
    api: '/api/chat',
    body: { sessionConfig },
  });

  const isStreaming = status === 'streaming';

  const handleSend = (text: string, files?: FileList) => {
    if (!text.trim() && (!files || files.length === 0)) return;
    append({
      role: 'user',
      content: text,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        primaryAgent={primaryAgent}
        isStreaming={isStreaming}
      />
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            onSend={handleSend}
            disabled={isStreaming}
            placeholder={
              primaryAgent
                ? `Message ${primaryAgent.name}...`
                : 'Configure an agent in Settings first...'
            }
          />
        </div>
      </div>
    </div>
  );
}
