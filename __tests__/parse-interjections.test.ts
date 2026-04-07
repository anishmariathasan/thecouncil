import { describe, it, expect } from 'vitest';
import { parseResponse } from '@/lib/orchestrator/parse-interjections';

describe('parseResponse', () => {
  it('should return text as-is when no interjections present', () => {
    const text = 'This is a simple response with no interjections.';
    const result = parseResponse(text);
    expect(result.primaryContent).toBe(text);
    expect(result.interjections).toHaveLength(0);
  });

  it('should parse a single interjection', () => {
    const text = `Primary agent response here.

---

**🔍 Research Analyst** _(Thorough analysis)_:

Actually, there is an important correction to make.`;

    const result = parseResponse(text);
    expect(result.primaryContent).toBe('Primary agent response here.');
    expect(result.interjections).toHaveLength(1);
    expect(result.interjections[0].agentAvatar).toBe('🔍');
    expect(result.interjections[0].agentName).toBe('Research Analyst');
    expect(result.interjections[0].agentRole).toBe('Thorough analysis');
    expect(result.interjections[0].content).toBe(
      'Actually, there is an important correction to make.'
    );
  });

  it('should parse multiple interjections', () => {
    const text = `Main response.

---

**🔍 Agent A** _(Role A)_:

First interjection.

---

**🧠 Agent B** _(Role B)_:

Second interjection.`;

    const result = parseResponse(text);
    expect(result.primaryContent).toBe('Main response.');
    expect(result.interjections).toHaveLength(2);
    expect(result.interjections[0].agentName).toBe('Agent A');
    expect(result.interjections[0].content).toBe('First interjection.');
    expect(result.interjections[1].agentName).toBe('Agent B');
    expect(result.interjections[1].content).toBe('Second interjection.');
  });

  it('should handle multiline interjection content', () => {
    const text = `Primary.

---

**🤖 Bot** _(Helper)_:

Line 1.

Line 2.

Line 3.`;

    const result = parseResponse(text);
    expect(result.primaryContent).toBe('Primary.');
    expect(result.interjections).toHaveLength(1);
    expect(result.interjections[0].content).toBe('Line 1.\n\nLine 2.\n\nLine 3.');
  });

  it('should handle empty primary content', () => {
    const text = `

---

**🔍 Agent** _(Role)_:

Only interjection, no primary.`;

    const result = parseResponse(text);
    expect(result.primaryContent).toBe('');
    expect(result.interjections).toHaveLength(1);
  });
});
