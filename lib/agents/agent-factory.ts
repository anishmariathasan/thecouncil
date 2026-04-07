import { createModelInstance, getThinkingParams } from '@/lib/providers/provider-factory';
import type { AgentConfig } from '@/lib/types/agents';
import type { CouncilConfig } from '@/lib/types/config';

export function createAgentModel(agent: AgentConfig, config: CouncilConfig) {
  return createModelInstance(agent, config);
}

export function getAgentProviderOptions(agent: AgentConfig): Record<string, Record<string, unknown>> {
  return getThinkingParams(agent);
}
