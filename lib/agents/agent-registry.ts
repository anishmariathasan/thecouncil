import type { AgentConfig } from '@/lib/types/agents';
import { readConfig, updateConfig } from '@/lib/storage/config-store';

export async function getAgents(): Promise<AgentConfig[]> {
  const config = await readConfig();
  return config.agents;
}

export async function getAgent(id: string): Promise<AgentConfig | undefined> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id);
}

export async function addAgent(agent: AgentConfig): Promise<void> {
  await updateConfig((config) => ({
    ...config,
    agents: [...config.agents, agent],
  }));
}

export async function updateAgent(id: string, updates: Partial<AgentConfig>): Promise<void> {
  await updateConfig((config) => ({
    ...config,
    agents: config.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  }));
}

export async function removeAgent(id: string): Promise<void> {
  await updateConfig((config) => ({
    ...config,
    agents: config.agents.filter((a) => a.id !== id),
    defaultPrimaryAgentId: config.defaultPrimaryAgentId === id ? null : config.defaultPrimaryAgentId,
  }));
}
