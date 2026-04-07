'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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
  allAgents?: AgentConfig[];
  conversationId?: string;
  initialMessages?: unknown[];
  onConversationCreated?: (id: string) => void;
}

export function ChatContainer({
  sessionConfig,
  primaryAgent,
  allAgents,
  conversationId,
  initialMessages,
  onConversationCreated,
}: ChatContainerProps) {
  const router = useRouter();
  const [councilStatusMessage, setCouncilStatusMessage] = useState('');
  const [isCouncilProcessing, setIsCouncilProcessing] = useState(false);
  const activeConversationId = useRef<string | undefined>(conversationId);
  const pendingSave = useRef(false);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      body: { sessionConfig },
    }),
    [sessionConfig],
  );

  const { messages, status, sendMessage, stop, error, clearError } = useChat({
    transport,
    messages: initialMessages as UIMessage[] | undefined,
    onData: (part) => {
      if (part.type !== 'data-council-status') return;
      if (!isCouncilStatusData(part.data)) return;

      if (part.data.phase === 'done') {
        setCouncilStatusMessage('');
        setIsCouncilProcessing(false);
        pendingSave.current = true;
        return;
      }

      setIsCouncilProcessing(true);
      setCouncilStatusMessage(part.data.message);
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted' || isCouncilProcessing;

  // Save messages to conversation whenever streaming finishes
  const saveMessages = useCallback(async (msgs: UIMessage[]) => {
    if (msgs.length === 0) return;

    if (!activeConversationId.current) {
      // Create a new conversation from the first message
      const firstUserMsg = msgs.find((m) => m.role === 'user');
      const title = firstUserMsg
        ? extractTitle(
            firstUserMsg.parts
              ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('') ?? 'New Chat'
          )
        : 'New Chat';

      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            mode: sessionConfig.mode,
            primaryAgentId: sessionConfig.primaryAgentId,
            agentIds: sessionConfig.agentIds,
          }),
        });
        if (res.ok) {
          const conv = await res.json();
          activeConversationId.current = conv.id;
          // Save messages to the newly created conversation
          await fetch(`/api/conversations/${conv.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: msgs }),
          });
          onConversationCreated?.(conv.id);
        }
      } catch {
        // Silent failure
      }
    } else {
      // Update existing conversation
      try {
        await fetch(`/api/conversations/${activeConversationId.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: msgs }),
        });
      } catch {
        // Silent failure
      }
    }
  }, [sessionConfig, onConversationCreated]);

  // Trigger save when streaming completes
  useEffect(() => {
    if (!isStreaming && pendingSave.current && messages.length > 0) {
      pendingSave.current = false;
      saveMessages(messages);
    }
  }, [isStreaming, messages, saveMessages]);

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
    pendingSave.current = false; // Will be set to true when done event arrives
    sendMessage({ text, ...(files && files.length > 0 ? { files } : {}) });
  };

  const handleStop = () => {
    void stop();
    setIsCouncilProcessing(false);
    setCouncilStatusMessage('');
    // Save whatever we have so far
    if (messages.length > 0) {
      saveMessages(messages);
    }
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

/** Extract a short title from the first user message. */
function extractTitle(text: string): string {
  const cleaned = text.trim().replace(/\n+/g, ' ');
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 47) + '...';
}
