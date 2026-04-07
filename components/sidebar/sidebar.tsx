'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from '@/lib/types/council';

interface SidebarProps {
  activeConversationId?: string;
  onConversationCreated?: (id: string) => void;
}

export function Sidebar({ activeConversationId, onConversationCreated }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  const handleNewChat = async () => {
    router.push('/chat');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          router.push('/chat');
        }
      }
    } catch {
      // Ignore
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Group conversations by date
  const grouped = groupConversations(conversations);

  return (
    <div className="flex flex-col h-full w-64 border-r bg-muted/30">
      <div className="p-4 flex items-center justify-between">
        <Link href="/chat">
          <h1 className="text-lg font-bold">The Council</h1>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
          onClick={handleNewChat}
        >
          <span className="text-base leading-none">+</span>
          New Chat
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <p className="text-xs text-muted-foreground px-2 py-4">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-4">
              No conversations yet. Start a new chat!
            </p>
          ) : (
            Object.entries(grouped).map(([label, convs]) => (
              <div key={label} className="mb-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                  {label}
                </p>
                {convs.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      conv.id === activeConversationId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''} · {conv.mode}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity text-xs px-1"
                      title="Delete conversation"
                    >
                      ×
                    </button>
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto p-4 space-y-2">
        <Separator className="mb-2" />
        <ThemeToggle />
        <Link href="/settings">
          <Button variant="outline" size="sm" className="w-full">
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}

function groupConversations(
  conversations: ConversationSummary[],
): Record<string, ConversationSummary[]> {
  const groups: Record<string, ConversationSummary[]> = {};
  const now = new Date();

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else if (diffDays < 7) label = 'This Week';
    else if (diffDays < 30) label = 'This Month';
    else label = 'Older';

    if (!groups[label]) groups[label] = [];
    groups[label].push(conv);
  }

  return groups;
}
