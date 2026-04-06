import type { ProviderId } from '@/lib/types/config';

export async function testApiKey(
  providerId: ProviderId,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (providerId) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
          return { success: false, error: `OpenAI API returned ${response.status}` };
        }
        return { success: true };
      }
      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });
        // 200 or 400 (bad request but authenticated) both mean key works
        if (response.status === 401 || response.status === 403) {
          return { success: false, error: 'Invalid API key' };
        }
        return { success: true };
      }
      case 'google': {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (!response.ok) {
          return { success: false, error: `Google API returned ${response.status}` };
        }
        return { success: true };
      }
      case 'openrouter': {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
          return { success: false, error: `OpenRouter API returned ${response.status}` };
        }
        return { success: true };
      }
      default:
        return { success: false, error: `Unknown provider: ${providerId}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
