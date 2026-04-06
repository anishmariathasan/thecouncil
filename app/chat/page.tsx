'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ChatContainer } from '@/components/chat/chat-container';
import type { AgentConfig } from '@/lib/types/agents';
import type { ConversationMode, SessionConfig } from '@/lib/types/council';
import type { CouncilConfig } from '@/lib/types/config';

export default function ChatPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [primaryAgentId, setPrimaryAgentId] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversationMode>('council');
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = (await res.json()) as CouncilConfig;
      setAgents(data.agents ?? []);
      setPrimaryAgentId(data.defaultPrimaryAgentId ?? data.agents?.[0]?.id ?? null);
      setMode(data.defaultMode ?? 'council');
    } catch {
      // Config may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const primaryAgent = agents.find((a) => a.id === primaryAgentId);

  const sessionConfig: SessionConfig = {
    mode,
    primaryAgentId: primaryAgentId ?? '',
    agentIds: agents.map((a) => a.id),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar
        agents={agents}
        primaryAgentId={primaryAgentId}
        mode={mode}
        onModeChange={setMode}
        onPrimaryAgentChange={setPrimaryAgentId}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatContainer
          sessionConfig={sessionConfig}
          primaryAgent={primaryAgent}
        />
      </main>
    </>
  );
}
