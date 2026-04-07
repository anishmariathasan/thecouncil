import { describe, it, expect } from 'vitest';
import { getThinkingParams } from '@/lib/providers/provider-factory';
import type { AgentConfig } from '@/lib/types/agents';

const baseAgent: AgentConfig = {
  id: 'test',
  name: 'Test Agent',
  role: 'Testing',
  systemPrompt: 'You are a test agent.',
  providerId: 'openai',
  modelId: 'gpt-5.4',
  colour: '#000',
  avatar: '🤖',
};

describe('getThinkingParams', () => {
  it('should return empty object when no thinking config', () => {
    const params = getThinkingParams(baseAgent);
    expect(params).toEqual({});
  });

  it('should return anthropic effort params for adaptive type', () => {
    const agent = { ...baseAgent, thinking: { type: 'adaptive' as const, value: 'high' } };
    const params = getThinkingParams(agent);
    expect(params).toEqual({ anthropic: { effort: 'high' } });
  });

  it('should return openai reasoning params for effort type', () => {
    const agent = { ...baseAgent, thinking: { type: 'effort' as const, value: 'medium' } };
    const params = getThinkingParams(agent);
    expect(params).toEqual({ openai: { reasoningEffort: 'medium' } });
  });

  it('should return google thinkingConfig for level type', () => {
    const agent = { ...baseAgent, thinking: { type: 'level' as const, value: 'high' } };
    const params = getThinkingParams(agent);
    expect(params).toEqual({ google: { thinkingConfig: { thinkingLevel: 'high' } } });
  });

  it('should return google thinkingBudget for budget type', () => {
    const agent = { ...baseAgent, thinking: { type: 'budget' as const, value: 8192 } };
    const params = getThinkingParams(agent);
    expect(params).toEqual({ google: { thinkingConfig: { thinkingBudget: 8192 } } });
  });
});
