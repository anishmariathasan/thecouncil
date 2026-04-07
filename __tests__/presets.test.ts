import { describe, it, expect } from 'vitest';
import { AGENT_PRESETS } from '@/lib/agents/presets';

describe('Agent Presets', () => {
  it('should have at least 6 presets', () => {
    expect(AGENT_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('should have both general and ML category presets', () => {
    const general = AGENT_PRESETS.filter((p) => p.category === 'general');
    const ml = AGENT_PRESETS.filter((p) => p.category === 'ml');
    expect(general.length).toBeGreaterThan(0);
    expect(ml.length).toBeGreaterThan(0);
  });

  it('should have required fields on each preset', () => {
    for (const preset of AGENT_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.role).toBeTruthy();
      expect(preset.systemPrompt).toBeTruthy();
      expect(preset.avatar).toBeTruthy();
      expect(['general', 'ml']).toContain(preset.category);
    }
  });

  it('should have unique names', () => {
    const names = AGENT_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
