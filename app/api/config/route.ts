import { NextResponse } from 'next/server';
import { readConfig, writeConfig } from '@/lib/storage/config-store';
import type { CouncilConfig } from '@/lib/types/config';

export async function GET() {
  try {
    const config = await readConfig();
    // Mask API keys for the frontend (show only last 4 chars)
    const masked = {
      ...config,
      apiKeys: Object.fromEntries(
        Object.entries(config.apiKeys).map(([provider, key]) => [
          provider,
          key ? `${'•'.repeat(Math.max(0, key.length - 4))}${key.slice(-4)}` : '',
        ])
      ),
    };
    return NextResponse.json(masked);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to read config' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<CouncilConfig>;
    const current = await readConfig();

    const updated: CouncilConfig = {
      ...current,
      ...body,
      apiKeys: {
        ...current.apiKeys,
        ...(body.apiKeys ?? {}),
      },
      orchestration: {
        ...current.orchestration,
        ...(body.orchestration ?? {}),
      },
    };

    // Don't overwrite real keys with masked values
    for (const [provider, key] of Object.entries(updated.apiKeys)) {
      if (key && key.includes('•')) {
        const currentKey = current.apiKeys[provider as keyof typeof current.apiKeys];
        if (currentKey) {
          (updated.apiKeys as Record<string, string>)[provider] = currentKey;
        }
      }
    }

    await writeConfig(updated);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update config' },
      { status: 500 }
    );
  }
}
