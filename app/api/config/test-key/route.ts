import { NextResponse } from 'next/server';
import { testApiKey } from '@/lib/providers/key-tester';
import type { ProviderId } from '@/lib/types/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, apiKey } = body as { providerId: ProviderId; apiKey: string };

    if (!providerId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing providerId or apiKey' },
        { status: 400 }
      );
    }

    const result = await testApiKey(providerId, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Test failed' },
      { status: 500 }
    );
  }
}
