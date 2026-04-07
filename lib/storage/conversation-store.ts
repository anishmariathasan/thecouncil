import { promises as fs } from 'fs';
import path from 'path';
import type { Conversation, ConversationSummary } from '@/lib/types/council';

const CONVERSATIONS_DIR = path.join(process.cwd(), '.council', 'conversations');

async function ensureDir() {
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
}

function conversationPath(id: string): string {
  return path.join(CONVERSATIONS_DIR, `${id}.json`);
}

export async function listConversations(): Promise<ConversationSummary[]> {
  await ensureDir();

  let files: string[];
  try {
    files = await fs.readdir(CONVERSATIONS_DIR);
  } catch {
    return [];
  }

  const summaries: ConversationSummary[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(CONVERSATIONS_DIR, file), 'utf-8');
      const conv = JSON.parse(raw) as Conversation;
      summaries.push({
        id: conv.id,
        title: conv.title,
        mode: conv.mode,
        messageCount: conv.messages.length,
        updatedAt: conv.updatedAt,
      });
    } catch {
      // Skip corrupt files
    }
  }

  // Most recently updated first
  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return summaries;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const raw = await fs.readFile(conversationPath(id), 'utf-8');
    return JSON.parse(raw) as Conversation;
  } catch {
    return null;
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  await ensureDir();
  await fs.writeFile(conversationPath(conversation.id), JSON.stringify(conversation, null, 2), 'utf-8');
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    await fs.unlink(conversationPath(id));
    return true;
  } catch {
    return false;
  }
}

export async function updateConversationTitle(id: string, title: string): Promise<boolean> {
  const conv = await getConversation(id);
  if (!conv) return false;
  conv.title = title;
  conv.updatedAt = new Date().toISOString();
  await saveConversation(conv);
  return true;
}
