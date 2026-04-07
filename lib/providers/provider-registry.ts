import type { ProviderDefinition, ModelDefinition } from '@/lib/types/agents';
import type { ProviderId } from '@/lib/types/config';

export const PROVIDERS: Record<string, ProviderDefinition> = {
  openai: {
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-5.4', name: 'GPT-5.4', tier: 'flagship',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['none', 'low', 'medium', 'high'], default: 'none' },
      },
      {
        id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro', tier: 'flagship',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['none', 'low', 'medium', 'high'], default: 'none' },
      },
      {
        id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', tier: 'efficient',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['none', 'low', 'medium', 'high'], default: 'none' },
      },
      {
        id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', tier: 'budget',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['none', 'low', 'medium', 'high'], default: 'none' },
      },
      {
        id: 'o3', name: 'o3', tier: 'reasoning',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['low', 'medium', 'high'], default: 'medium' },
      },
      {
        id: 'o3-pro', name: 'o3-pro', tier: 'reasoning',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['low', 'medium', 'high'], default: 'high' },
      },
      {
        id: 'o4-mini', name: 'o4-mini', tier: 'reasoning',
        capabilities: ['vision', 'pdf', 'reasoning'],
        reasoning: { type: 'effort', values: ['low', 'medium', 'high'], default: 'medium' },
      },
      {
        id: 'gpt-4.1', name: 'GPT-4.1', tier: 'legacy',
        capabilities: ['vision', 'pdf'],
      },
      {
        id: 'gpt-4o', name: 'GPT-4o', tier: 'legacy',
        capabilities: ['vision', 'pdf'],
      },
    ],
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      {
        id: 'claude-opus-4-6', name: 'Claude Opus 4.6', tier: 'flagship', context: '1M',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'adaptive', values: ['low', 'medium', 'high', 'max'], default: 'high' },
      },
      {
        id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tier: 'efficient', context: '1M',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'adaptive', values: ['low', 'medium', 'high'], default: 'high' },
      },
      {
        id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', tier: 'budget', context: '200K',
        capabilities: ['vision', 'pdf'],
      },
    ],
  },
  google: {
    name: 'Google',
    models: [
      {
        id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tier: 'flagship',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'level', values: ['low', 'medium', 'high'], default: 'high' },
      },
      {
        id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Preview)', tier: 'budget',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'level', values: ['minimal', 'low', 'medium', 'high'], default: 'high' },
      },
      {
        id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', tier: 'efficient',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'level', values: ['minimal', 'low', 'medium', 'high'], default: 'high' },
      },
      {
        id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'legacy',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'budget', min: 128, max: 32768, default: -1 },
      },
      {
        id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'legacy',
        capabilities: ['vision', 'pdf', 'thinking'],
        thinking: { type: 'budget', min: 0, max: 24576, default: -1 },
      },
    ],
  },
  openrouter: {
    name: 'OpenRouter',
    models: 'dynamic',
  },
};

export function getProvider(providerId: string): ProviderDefinition | undefined {
  return PROVIDERS[providerId];
}

export function getModels(providerId: string): ModelDefinition[] {
  const provider = PROVIDERS[providerId];
  if (!provider || provider.models === 'dynamic') return [];
  return provider.models;
}

export function getModel(providerId: string, modelId: string): ModelDefinition | undefined {
  return getModels(providerId).find((m) => m.id === modelId);
}

export function getAvailableProviders(apiKeys: Partial<Record<ProviderId, string>>): string[] {
  return Object.entries(apiKeys)
    .filter(([, key]) => key && key.trim().length > 0)
    .map(([id]) => id);
}

export function getAvailableModels(
  providerId: string,
  apiKeys: Partial<Record<ProviderId, string>>
): ModelDefinition[] {
  if (!apiKeys[providerId as ProviderId]) return [];
  return getModels(providerId);
}
