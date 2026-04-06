'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiKeyManager } from '@/components/settings/api-key-manager';
import { AgentConfigurator } from '@/components/settings/agent-configurator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { ProviderId, CouncilConfig } from '@/lib/types/config';
import type { AgentConfig } from '@/lib/types/agents';
import Link from 'next/link';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = (await res.json()) as CouncilConfig;
      setApiKeys(data.apiKeys ?? {});
      setAgents(data.agents ?? []);
    } catch {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (providerId: ProviderId, apiKey: string) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: { [providerId]: apiKey } }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(`${providerId} API key saved`);
      await fetchConfig();
    } catch {
      toast.error('Failed to save API key');
    }
  };

  const handleRemove = async (providerId: ProviderId) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: { [providerId]: '' } }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      toast.success(`${providerId} API key removed`);
      await fetchConfig();
    } catch {
      toast.error('Failed to remove API key');
    }
  };

  const handleTest = async (providerId: ProviderId, apiKey: string) => {
    const res = await fetch('/api/config/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, apiKey }),
    });
    return res.json();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your API keys and preferences
            </p>
          </div>
          <Link href="/chat">
            <Button variant="outline">Back to Chat</Button>
          </Link>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">API Keys</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Keys are stored locally on your machine only. They are never sent anywhere except to the respective provider&apos;s API.
            </p>
            <ApiKeyManager
              apiKeys={apiKeys}
              onSave={handleSave}
              onRemove={handleRemove}
              onTest={handleTest}
            />
          </section>

          <Separator />

          <section>
            <AgentConfigurator
              agents={agents}
              apiKeys={apiKeys}
              onAdd={async (agent) => {
                try {
                  const config = await (await fetch('/api/config')).json();
                  const res = await fetch('/api/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      agents: [...(config.agents ?? []), agent],
                      defaultPrimaryAgentId: config.defaultPrimaryAgentId ?? agent.id,
                    }),
                  });
                  if (!res.ok) throw new Error('Failed to add agent');
                  toast.success(`${agent.name} added`);
                  await fetchConfig();
                } catch {
                  toast.error('Failed to add agent');
                }
              }}
              onRemove={async (agentId) => {
                try {
                  const config = await (await fetch('/api/config')).json();
                  const res = await fetch('/api/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      agents: (config.agents ?? []).filter((a: AgentConfig) => a.id !== agentId),
                      defaultPrimaryAgentId:
                        config.defaultPrimaryAgentId === agentId
                          ? null
                          : config.defaultPrimaryAgentId,
                    }),
                  });
                  if (!res.ok) throw new Error('Failed to remove agent');
                  toast.success('Agent removed');
                  await fetchConfig();
                } catch {
                  toast.error('Failed to remove agent');
                }
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
