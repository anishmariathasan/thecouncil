import { describe, it, expect } from 'vitest';
import { PROVIDERS, getModels, getModel, getAvailableProviders } from '@/lib/providers/provider-registry';

describe('Provider Registry', () => {
  it('should have all four providers defined', () => {
    expect(PROVIDERS).toHaveProperty('openai');
    expect(PROVIDERS).toHaveProperty('anthropic');
    expect(PROVIDERS).toHaveProperty('google');
    expect(PROVIDERS).toHaveProperty('openrouter');
  });

  it('should return models for openai', () => {
    const models = getModels('openai');
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((m) => m.id.startsWith('gpt'))).toBe(true);
  });

  it('should return models for anthropic', () => {
    const models = getModels('anthropic');
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((m) => m.id.startsWith('claude'))).toBe(true);
  });

  it('should return models for google', () => {
    const models = getModels('google');
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((m) => m.id.startsWith('gemini'))).toBe(true);
  });

  it('should return empty array for openrouter (dynamic)', () => {
    const models = getModels('openrouter');
    expect(models).toEqual([]);
  });

  it('should find a specific model by provider and id', () => {
    const model = getModel('anthropic', 'claude-opus-4-6');
    expect(model).toBeDefined();
    expect(model!.name).toBe('Claude Opus 4.6');
    expect(model!.tier).toBe('flagship');
  });

  it('should return undefined for unknown model', () => {
    const model = getModel('openai', 'nonexistent-model');
    expect(model).toBeUndefined();
  });

  it('should return available providers based on api keys', () => {
    const available = getAvailableProviders({
      openai: 'sk-test',
      anthropic: '',
      google: 'test-key',
    });
    expect(available).toContain('openai');
    expect(available).toContain('google');
    expect(available).not.toContain('anthropic');
  });

  it('should have thinking config for claude models', () => {
    const opus = getModel('anthropic', 'claude-opus-4-6');
    expect(opus!.thinking).toBeDefined();
    expect(opus!.thinking!.type).toBe('adaptive');
  });

  it('should have reasoning config for openai reasoning models', () => {
    const o3 = getModel('openai', 'o3');
    expect(o3!.reasoning).toBeDefined();
    expect(o3!.reasoning!.type).toBe('effort');
  });

  it('should have thinking config for google models', () => {
    const gemini = getModel('google', 'gemini-3.1-pro-preview');
    expect(gemini!.thinking).toBeDefined();
    expect(gemini!.thinking!.type).toBe('level');
  });
});
