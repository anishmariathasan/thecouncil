import {
  streamText,
  generateText,
  type ModelMessage,
  type UIMessageStreamWriter,
} from 'ai';
import { nanoid } from 'nanoid';
import { createModelInstance, getThinkingParams } from '@/lib/providers/provider-factory';
import type { AgentConfig } from '@/lib/types/agents';
import type { CouncilConfig, OrchestrationConfig } from '@/lib/types/config';
import type { SessionConfig, GateDecision } from '@/lib/types/council';

interface OrchestratorContext {
  config: CouncilConfig;
  sessionConfig: SessionConfig;
  modelMessages: ModelMessage[];
  orchestration: OrchestrationConfig;
}

interface CouncilStatusData {
  phase: 'gate-check' | 'interjections' | 'round-robin' | 'done';
  pendingAgents: number;
  totalAgents: number;
  message: string;
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRequestPacer(orchestration: OrchestrationConfig): () => Promise<void> {
  let nextAllowedAt = 0;

  return async () => {
    const spacingMs = Math.max(0, orchestration.requestSpacingMs);
    if (spacingMs <= 0) {
      nextAllowedAt = Date.now();
      return;
    }

    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedAt - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    nextAllowedAt = Date.now() + spacingMs;
  };
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();

  const nonRetryablePatterns = [
    'is not found for api version',
    'not supported for generatecontent',
    'unknown provider',
    'no api key configured',
    'invalid api key',
    'authentication',
    'permission denied',
    'forbidden',
  ];

  if (nonRetryablePatterns.some((pattern) => message.includes(pattern))) {
    return false;
  }

  const retryablePatterns = [
    'rate limit',
    'quota exceeded',
    'too many requests',
    'temporar',
    'timeout',
    'network',
    'service unavailable',
    'overloaded',
    '502',
    '503',
    '504',
    '429',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

function getBackoffDelayMs(
  attempt: number,
  orchestration: OrchestrationConfig,
): number {
  const initial = Math.max(0, orchestration.requestBackoffInitialMs);
  const max = Math.max(initial, orchestration.requestBackoffMaxMs);
  const jitterRatio = Math.max(0, Math.min(orchestration.requestBackoffJitterRatio, 1));

  const exponential = Math.min(max, initial * Math.pow(2, attempt));
  const jitter = Math.floor(exponential * jitterRatio * Math.random());
  return Math.min(max, exponential + jitter);
}

async function runWithRetryBackoff<T>(
  label: string,
  orchestration: OrchestrationConfig,
  run: () => Promise<T>,
): Promise<T> {
  const attempts = Math.max(1, orchestration.requestRetryAttempts);

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      const hasMoreAttempts = attempt < attempts - 1;
      if (!hasMoreAttempts || !isRetryableError(error)) {
        throw error;
      }

      const delayMs = getBackoffDelayMs(attempt, orchestration);
      console.warn(`Retrying ${label} in ${delayMs}ms (attempt ${attempt + 2}/${attempts})`);
      await sleep(delayMs);
    }
  }

  throw new Error(`Failed to execute ${label}`);
}

function writeCouncilStatus(
  writer: UIMessageStreamWriter,
  status: CouncilStatusData,
): void {
  writer.write({
    type: 'data-council-status',
    data: status,
    transient: true,
  });
}

/**
 * Run the primary agent and stream its response to the writer.
 * Returns the full text once streaming completes.
 */
async function streamPrimaryAgent(
  agent: AgentConfig,
  ctx: OrchestratorContext,
  writer: UIMessageStreamWriter,
  waitForRequestSlot: () => Promise<void>,
): Promise<string> {
  await waitForRequestSlot();

  const model = createModelInstance(agent, ctx.config);
  const providerOptions = getThinkingParams(agent);

  const result = streamText({
    model,
    system: agent.systemPrompt,
    messages: ctx.modelMessages,
    ...(Object.keys(providerOptions).length > 0
      ? { providerOptions: providerOptions as never }
      : {}),
  });

  // Merge the primary agent's stream into our writer
  writer.merge(result.toUIMessageStream());

  // Await completion and return the full text
  return result.text;
}

/**
 * Gate check: ask a silent agent whether it has something meaningful to add.
 * Returns a YES/NO decision with a brief reason.
 */
async function runGateCheck(
  agent: AgentConfig,
  primaryAgentName: string,
  primaryResponse: string,
  ctx: OrchestratorContext,
  waitForRequestSlot: () => Promise<void>,
): Promise<GateDecision> {
  const gatePrompt = `You are ${agent.name}, a ${agent.role}.

You have been silently observing a conversation. The primary agent (${primaryAgentName}) just responded:

---
${primaryResponse}
---

Do you have a MEANINGFUL disagreement, important correction, critical additional perspective, or essential information that the primary agent missed?

Rules:
- Only say YES if you have something SUBSTANTIAL to add — not just rephrasing or minor elaboration.
- If the primary agent's response is broadly correct and complete, say NO.
- Prefer silence over noise.

Respond with exactly one word: YES or NO`;

  try {
    await waitForRequestSlot();

    const model = createModelInstance(agent, ctx.config);

    const result = await runWithRetryBackoff(
      `gate check (${agent.name})`,
      ctx.orchestration,
      () => generateText({
        model,
        prompt: gatePrompt,
        maxOutputTokens: 5,
      }),
    );

    const decision = result.text.trim().toUpperCase().startsWith('YES')
      ? 'yes' as const
      : 'no' as const;

    return {
      agentId: agent.id,
      agentName: agent.name,
      decision,
      reason: result.text.trim(),
    };
  } catch {
    return {
      agentId: agent.id,
      agentName: agent.name,
      decision: 'no',
      reason: 'Gate check failed',
    };
  }
}

/**
 * Generate an interjection from an agent that passed the gate check.
 * Returns the interjection text.
 */
async function generateInterjection(
  agent: AgentConfig,
  primaryAgentName: string,
  primaryResponse: string,
  ctx: OrchestratorContext,
  waitForRequestSlot: () => Promise<void>,
): Promise<string> {
  const interjectionPrompt = `You are ${agent.name}, a ${agent.role}.

You are interjecting into a conversation because you have something meaningful to add.

The primary agent (${primaryAgentName}) responded:
---
${primaryResponse}
---

Provide your interjection. Be concise and focus only on what the primary agent missed, got wrong, or what critical perspective you can add. Do not repeat what was already said. Be direct and substantive.`;

  // Build messages: the conversation so far + the interjection prompt
  const interjectionMessages: ModelMessage[] = [
    ...ctx.modelMessages,
    { role: 'user', content: interjectionPrompt },
  ];

  await waitForRequestSlot();

  const model = createModelInstance(agent, ctx.config);
  const providerOptions = getThinkingParams(agent);

  const result = await runWithRetryBackoff(
    `interjection (${agent.name})`,
    ctx.orchestration,
    () => generateText({
      model,
      system: agent.systemPrompt,
      messages: interjectionMessages,
      ...(Object.keys(providerOptions).length > 0
        ? { providerOptions: providerOptions as never }
        : {}),
    }),
  );

  return result.text;
}

/**
 * Write an interjection as data parts in the stream so the frontend can display it.
 */
function writeInterjection(
  writer: UIMessageStreamWriter,
  agent: AgentConfig,
  content: string,
): void {
  const id = nanoid();
  // We write the interjection as a separate text block with a custom annotation approach.
  // Since the stream protocol supports text parts with IDs, we embed agent info
  // as a formatted block within the ongoing message.
  const formattedInterjection = `\n\n---\n\n**${agent.avatar} ${agent.name}** _(${agent.role})_:\n\n${content}`;

  writer.write({ type: 'text-start', id });
  writer.write({ type: 'text-delta', id, delta: formattedInterjection });
  writer.write({ type: 'text-end', id });
}

/**
 * Council mode: primary agent responds, then silent agents gate-check and optionally interject.
 */
export async function runCouncilMode(
  writer: UIMessageStreamWriter,
  ctx: OrchestratorContext,
): Promise<void> {
  const { config, sessionConfig, orchestration } = ctx;
  const waitForRequestSlot = createRequestPacer(orchestration);

  const primaryAgent = config.agents.find((a) => a.id === sessionConfig.primaryAgentId);
  if (!primaryAgent) {
    writer.write({ type: 'error', errorText: 'Primary agent not found' });
    return;
  }

  // Phase 1: Stream primary agent response
  const primaryText = await streamPrimaryAgent(primaryAgent, ctx, writer, waitForRequestSlot);

  // Phase 2: Gate checks on silent agents
  const silentAgents = config.agents.filter(
    (a) => a.id !== sessionConfig.primaryAgentId && sessionConfig.agentIds.includes(a.id),
  );

  if (silentAgents.length === 0) {
    writeCouncilStatus(writer, {
      phase: 'done',
      pendingAgents: 0,
      totalAgents: 0,
      message: 'Response complete.',
    });
    return;
  }

  // Run gate checks sequentially to avoid request bursts on tier-limited APIs.
  let pendingGateChecks = silentAgents.length;
  writeCouncilStatus(writer, {
    phase: 'gate-check',
    pendingAgents: pendingGateChecks,
    totalAgents: silentAgents.length,
    message: `Other agents are reviewing the primary response (${pendingGateChecks} remaining).`,
  });

  const gateResults: GateDecision[] = [];
  for (const agent of silentAgents) {
    const result = await runGateCheck(
      agent,
      primaryAgent.name,
      primaryText,
      ctx,
      waitForRequestSlot,
    );
    gateResults.push(result);

    pendingGateChecks -= 1;
    writeCouncilStatus(writer, {
      phase: 'gate-check',
      pendingAgents: pendingGateChecks,
      totalAgents: silentAgents.length,
      message:
        pendingGateChecks > 0
          ? `Other agents are still reviewing (${pendingGateChecks} remaining).`
          : 'Gate checks finished.',
    });
  }

  const approvedAgents: AgentConfig[] = [];
  for (let i = 0; i < gateResults.length; i++) {
    const result = gateResults[i];
    if (result.decision === 'yes') {
      approvedAgents.push(silentAgents[i]);
    }
  }

  // Phase 3: Interjections (limited by maxInterjectionsPerMessage)
  const interjectingAgents = approvedAgents.slice(
    0,
    orchestration.maxInterjectionsPerMessage,
  );

  if (interjectingAgents.length > 0) {
    writeCouncilStatus(writer, {
      phase: 'interjections',
      pendingAgents: interjectingAgents.length,
      totalAgents: interjectingAgents.length,
      message: `Generating interjections from ${interjectingAgents.length} agent${interjectingAgents.length === 1 ? '' : 's'}...`,
    });
  }

  let pendingInterjections = interjectingAgents.length;

  for (const agent of interjectingAgents) {
    try {
      const interjectionText = await generateInterjection(
        agent,
        primaryAgent.name,
        primaryText,
        ctx,
        waitForRequestSlot,
      );
      writeInterjection(writer, agent, interjectionText);
    } catch {
      // Silently skip failed interjections
    } finally {
      pendingInterjections -= 1;
      if (interjectingAgents.length > 0) {
        writeCouncilStatus(writer, {
          phase: 'interjections',
          pendingAgents: pendingInterjections,
          totalAgents: interjectingAgents.length,
          message:
            pendingInterjections > 0
              ? `Finalizing council response (${pendingInterjections} interjection${pendingInterjections === 1 ? '' : 's'} remaining).`
              : 'Council response complete.',
        });
      }
    }
  }

  writeCouncilStatus(writer, {
    phase: 'done',
    pendingAgents: 0,
    totalAgents: interjectingAgents.length,
    message: 'Response complete.',
  });
}

/**
 * Round robin mode: each agent responds in sequence.
 */
export async function runRoundRobinMode(
  writer: UIMessageStreamWriter,
  ctx: OrchestratorContext,
): Promise<void> {
  const { config, sessionConfig, orchestration } = ctx;
  const waitForRequestSlot = createRequestPacer(orchestration);

  const activeAgents = config.agents.filter((a) =>
    sessionConfig.agentIds.includes(a.id),
  );

  if (activeAgents.length === 0) {
    writer.write({ type: 'error', errorText: 'No agents configured' });
    return;
  }

  // First agent streams directly
  const firstAgent = activeAgents[0];
  const firstText = await streamPrimaryAgent(firstAgent, ctx, writer, waitForRequestSlot);

  if (activeAgents.length > 1) {
    writeCouncilStatus(writer, {
      phase: 'round-robin',
      pendingAgents: activeAgents.length - 1,
      totalAgents: activeAgents.length - 1,
      message: `Other agents are still preparing responses (${activeAgents.length - 1} remaining).`,
    });
  }

  // Subsequent agents respond sequentially
  let pendingAgents = activeAgents.length - 1;
  for (let i = 1; i < activeAgents.length; i++) {
    const agent = activeAgents[i];
    try {
      await waitForRequestSlot();

      const model = createModelInstance(agent, ctx.config);
      const providerOptions = getThinkingParams(agent);

      const result = await runWithRetryBackoff(
        `round-robin response (${agent.name})`,
        ctx.orchestration,
        () => generateText({
          model,
          system: agent.systemPrompt,
          messages: [
            ...ctx.modelMessages,
            { role: 'assistant', content: firstText },
            {
              role: 'user',
              content: `The previous agents have already responded. Now it is your turn as ${agent.name} (${agent.role}). Provide your unique perspective. Be concise and avoid repeating what others have said.`,
            },
          ],
          ...(Object.keys(providerOptions).length > 0
            ? { providerOptions: providerOptions as never }
            : {}),
        }),
      );

      writeInterjection(writer, agent, result.text);
    } catch {
      // Skip failed agents
    } finally {
      pendingAgents -= 1;
      if (activeAgents.length > 1) {
        writeCouncilStatus(writer, {
          phase: 'round-robin',
          pendingAgents,
          totalAgents: activeAgents.length - 1,
          message:
            pendingAgents > 0
              ? `Other agents are still preparing responses (${pendingAgents} remaining).`
              : 'Response complete.',
        });
      }
    }
  }

  writeCouncilStatus(writer, {
    phase: 'done',
    pendingAgents: 0,
    totalAgents: Math.max(0, activeAgents.length - 1),
    message: 'Response complete.',
  });
}
