import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_ORCHESTRATION_CONFIG } from '@/lib/types/config';

describe('Config defaults', () => {
  it('should have sensible orchestration defaults', () => {
    expect(DEFAULT_ORCHESTRATION_CONFIG.maxInterjectionDepth).toBe(1);
    expect(DEFAULT_ORCHESTRATION_CONFIG.cooldownMessages).toBe(3);
    expect(DEFAULT_ORCHESTRATION_CONFIG.maxInterjectionsPerMessage).toBe(2);
    expect(DEFAULT_ORCHESTRATION_CONFIG.requestRetryAttempts).toBe(3);
    expect(DEFAULT_ORCHESTRATION_CONFIG.requestBackoffInitialMs).toBe(1200);
    expect(DEFAULT_ORCHESTRATION_CONFIG.requestBackoffMaxMs).toBe(30000);
    expect(DEFAULT_ORCHESTRATION_CONFIG.requestBackoffJitterRatio).toBe(0.2);
    expect(DEFAULT_ORCHESTRATION_CONFIG.requestSpacingMs).toBe(600);
  });

  it('should start with empty config', () => {
    expect(DEFAULT_CONFIG.apiKeys).toEqual({});
    expect(DEFAULT_CONFIG.agents).toEqual([]);
    expect(DEFAULT_CONFIG.defaultMode).toBe('council');
    expect(DEFAULT_CONFIG.defaultPrimaryAgentId).toBeNull();
  });
});
