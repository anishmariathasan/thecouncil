export type ProviderId = 'openai' | 'anthropic' | 'google' | 'openrouter';

export interface OrchestrationConfig {
  maxInterjectionDepth: number;
  cooldownMessages: number;
  maxInterjectionsPerMessage: number;
}

export interface CouncilConfig {
  apiKeys: Partial<Record<ProviderId, string>>;
  agents: import('./agents').AgentConfig[];
  defaultMode: import('./council').ConversationMode;
  defaultPrimaryAgentId: string | null;
  orchestration: OrchestrationConfig;
}

export const DEFAULT_ORCHESTRATION_CONFIG: OrchestrationConfig = {
  maxInterjectionDepth: 1,
  cooldownMessages: 3,
  maxInterjectionsPerMessage: 2,
};

export const DEFAULT_CONFIG: CouncilConfig = {
  apiKeys: {},
  agents: [],
  defaultMode: 'council',
  defaultPrimaryAgentId: null,
  orchestration: DEFAULT_ORCHESTRATION_CONFIG,
};
