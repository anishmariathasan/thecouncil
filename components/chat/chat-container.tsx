'use client';

import { useEffect, useMemo, useState } from 'react';
import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import type { AgentConfig } from '@/lib/types/agents';
import type { SessionConfig } from '@/lib/types/council';

interface CouncilStatusData {
  phase: 'gate-check' | 'interjections' | 'round-robin' | 'done';
  pendingAgents: number;
  totalAgents: number;
  message: string;
}

function isCouncilStatusData(value: unknown): value is CouncilStatusData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CouncilStatusData>;
  return (
    typeof candidate.phase === 'string' &&
    typeof candidate.pendingAgents === 'number' &&
    typeof candidate.totalAgents === 'number' &&
    typeof candidate.message === 'string'
  );
}

interface ChatContainerProps {
  sessionConfig: SessionConfig;
  primaryAgent?: AgentConfig;
}

export function ChatContainer({ sessionConfig, primaryAgent }: ChatContainerProps) {
  const [councilStatusMessage, setCouncilStatusMessage] = useState('');
  const [isCouncilProcessing, setIsCouncilProcessing] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      body: { sessionConfig },
    }),
    [sessionConfig],
  );

  const { messages, status, sendMessage, stop, error, clearError } = useChat({
    transport,
    onData: (part) => {
      if (part.type !== 'data-council-status') return;
      if (!isCouncilStatusData(part.data)) return;

      if (part.data.phase === 'done') {
        setCouncilStatusMessage('');
        setIsCouncilProcessing(false);
        return;
      }

      setIsCouncilProcessing(true);
      setCouncilStatusMessage(part.data.message);
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted' || isCouncilProcessing;

  useEffect(() => {
    if (!isStreaming) {
      setCouncilStatusMessage('');
    }
  }, [isStreaming]);

  useEffect(() => {
    if (status === 'error') {
      setIsCouncilProcessing(false);
      setCouncilStatusMessage('');
    }
  }, [status]);

  useEffect(() => {
    if (!error) return;
    toast.error(error.message || 'Chat request failed');
    clearError();
  }, [error, clearError]);

  const handleSend = (text: string, files?: FileList) => {
    if (!text.trim() && (!files || files.length === 0)) return;
    setIsCouncilProcessing(true);
    setCouncilStatusMessage('Generating primary response...');
    sendMessage({ text, ...(files && files.length > 0 ? { files } : {}) });
  };

  const handleStop = () => {
    void stop();
    setIsCouncilProcessing(false);
    setCouncilStatusMessage('');
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
            onStop={handleStop}
            isStreaming={isStreaming}
            statusText={councilStatusMessage}
            disabled={!primaryAgent}
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
