import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { AgentConfig } from '@/lib/types/agents';
import type { CouncilConfig } from '@/lib/types/config';

export function createModelInstance(agent: AgentConfig, config: CouncilConfig) {
  const apiKey = config.apiKeys[agent.providerId];
  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${agent.providerId}`);
  }

  switch (agent.providerId) {
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(agent.modelId);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(agent.modelId);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(agent.modelId);
    }
    case 'openrouter': {
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(agent.modelId);
    }
    default:
      throw new Error(`Unknown provider: ${agent.providerId}`);
  }
}

export function getThinkingParams(agent: AgentConfig): Record<string, unknown> {
  if (!agent.thinking) return {};

  switch (agent.thinking.type) {
    case 'adaptive':
      return {
        thinking: { type: 'adaptive' },
        output_config: { effort: agent.thinking.value },
      };
    case 'effort':
      return {
        reasoning: { effort: agent.thinking.value },
      };
    case 'level':
      return {
        thinkingLevel: agent.thinking.value,
      };
    case 'budget':
      return {
        thinkingBudget: agent.thinking.value,
      };
    default:
      return {};
  }
}
