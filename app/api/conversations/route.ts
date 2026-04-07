import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  listConversations,
  saveConversation,
} from '@/lib/storage/conversation-store';
import type { Conversation } from '@/lib/types/council';

/** GET /api/conversations — list all conversations (summaries only) */
export async function GET() {
  const summaries = await listConversations();
  return NextResponse.json(summaries);
}

/** POST /api/conversations — create a new conversation */
export async function POST(request: Request) {
  const body = await request.json();
  const { title, mode, primaryAgentId, agentIds } = body as {
    title?: string;
    mode?: string;
    primaryAgentId?: string;
    agentIds?: string[];
  };

  const conversation: Conversation = {
    id: nanoid(),
    title: title || 'New Chat',
    mode: (mode as Conversation['mode']) || 'council',
    primaryAgentId: primaryAgentId || '',
    agentIds: agentIds || [],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveConversation(conversation);
  return NextResponse.json(conversation, { status: 201 });
}
