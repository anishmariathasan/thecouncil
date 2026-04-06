import { streamText, type UIMessage } from 'ai';
import { readConfig } from '@/lib/storage/config-store';
import { createAgentModel, getAgentProviderOptions } from '@/lib/agents/agent-factory';
import type { SessionConfig } from '@/lib/types/council';

export async function POST(request: Request) {
  const body = await request.json();
  const { messages, sessionConfig } = body as {
    messages: UIMessage[];
    sessionConfig: SessionConfig;
  };

  const config = await readConfig();

  const primaryAgent = config.agents.find((a) => a.id === sessionConfig.primaryAgentId);
  if (!primaryAgent) {
    return new Response(JSON.stringify({ error: 'Primary agent not found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const model = createAgentModel(primaryAgent, config);
  const providerOptions = getAgentProviderOptions(primaryAgent);

  const result = streamText({
    model,
    system: primaryAgent.systemPrompt,
    messages,
    providerOptions,
  });

  return result.toDataStreamResponse();
}
