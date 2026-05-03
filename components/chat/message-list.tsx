'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { MessageBubble, type ChatFileAttachment } from './message-bubble';
import { InterjectionBlock } from './interjection-block';
import { parseResponse } from '@/lib/orchestrator/parse-interjections';
import type { UIMessage } from 'ai';
import type { AgentConfig } from '@/lib/types/agents';

interface MessageListProps {
  messages: UIMessage[];
  primaryAgent?: AgentConfig;
  allAgents?: AgentConfig[];
  isStreaming?: boolean;
}

interface ResponseAgentSnapshot {
  id: string;
  name: string;
  role: string;
  avatar: string;
  colour: string;
  modelId: string;
  providerId: string;
}

interface AssistantMessageMetadata {
  primaryAgent?: ResponseAgentSnapshot;
}

function isAssistantMessageMetadata(value: unknown): value is AssistantMessageMetadata {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Partial<AssistantMessageMetadata>;
  const agent = metadata.primaryAgent as Partial<ResponseAgentSnapshot> | undefined;

  return (
    !agent ||
    (
      typeof agent.id === 'string' &&
      typeof agent.name === 'string' &&
      typeof agent.role === 'string' &&
      typeof agent.avatar === 'string' &&
      typeof agent.colour === 'string' &&
      typeof agent.modelId === 'string' &&
      typeof agent.providerId === 'string'
    )
  );
}

function toAgentSnapshot(agent: AgentConfig): ResponseAgentSnapshot {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    avatar: agent.avatar,
    colour: agent.colour,
    modelId: agent.modelId,
    providerId: agent.providerId,
  };
}

function getResponseAgent(
  message: UIMessage,
  fallbackAgent: AgentConfig | undefined,
  useFallback: boolean,
): ResponseAgentSnapshot | undefined {
  if (isAssistantMessageMetadata(message.metadata)) {
    return message.metadata.primaryAgent;
  }

  return useFallback && fallbackAgent ? toAgentSnapshot(fallbackAgent) : undefined;
}

function findAgentForInterjection(
  agents: AgentConfig[],
  agentName: string,
  agentRole: string,
): AgentConfig | undefined {
  return agents.find((agent) => agent.name === agentName && agent.role === agentRole)
    ?? agents.find((agent) => agent.name === agentName);
}

export function MessageList({
  messages,
  primaryAgent,
  allAgents = [],
  isStreaming,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const messageCountChanged = messages.length !== previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (messageCountChanged) {
      shouldAutoScrollRef.current = true;
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
      return;
    }

    if (shouldAutoScrollRef.current) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight });
    }
  }, [messages]);

  const handleScroll = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const distanceFromBottom =
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
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
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const textContent = message.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('') ?? '';
          const fileParts = message.parts
            ?.filter((p): p is ChatFileAttachment & { type: 'file' } => p.type === 'file')
            .map(({ filename, mediaType, url }) => ({ filename, mediaType, url })) ?? [];

          if (message.role === 'assistant') {
            if (!textContent.trim() && fileParts.length === 0) return null;

            const { primaryContent, interjections } = parseResponse(textContent);
            const responseAgent = getResponseAgent(
              message,
              primaryAgent,
              isLast && Boolean(isStreaming),
            );

            return (
              <div key={message.id}>
                <MessageBubble
                  role="assistant"
                  content={primaryContent}
                  files={fileParts}
                  responseKind="primary"
                  agentName={responseAgent?.name}
                  agentModel={responseAgent?.modelId}
                  agentAvatar={responseAgent?.avatar}
                  agentColour={responseAgent?.colour}
                  isStreaming={isLast && isStreaming && interjections.length === 0}
                />
                {interjections.map((interjection, i) => {
                  const interjectionAgent = findAgentForInterjection(
                    allAgents,
                    interjection.agentName,
                    interjection.agentRole,
                  );

                  return (
                    <InterjectionBlock
                      key={`${message.id}-interjection-${i}`}
                      agentName={interjection.agentName}
                      agentRole={interjection.agentRole}
                      agentAvatar={interjectionAgent?.avatar ?? interjection.agentAvatar}
                      agentColour={interjectionAgent?.colour}
                      content={interjection.content}
                    />
                  );
                })}
              </div>
            );
          }

          return (
            <MessageBubble
              key={message.id}
              role="user"
              content={textContent}
              files={fileParts}
            />
          );
        })}
      </div>
    </div>
  );
}
