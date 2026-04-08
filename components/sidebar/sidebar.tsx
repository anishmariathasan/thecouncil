'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
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
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [savingRenameId, setSavingRenameId] = useState<string | null>(null);

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

  const handleStartRename = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
    currentTitle: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingConversationId(id);
    setEditingTitle(currentTitle);
  };

  const handleCancelRename = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleSaveRename = async (id: string) => {
    const nextTitle = editingTitle.trim();
    const original = conversations.find((conv) => conv.id === id)?.title ?? '';

    if (!nextTitle || nextTitle === original) {
      handleCancelRename();
      return;
    }

    setSavingRenameId(id);

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: nextTitle }),
      });

      if (res.ok) {
        const updated = await res.json();
        setConversations((prev) =>
          prev
            .map((conv) =>
              conv.id === id
                ? {
                    ...conv,
                    title: updated.title,
                    updatedAt: updated.updatedAt,
                  }
                : conv,
            )
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            ),
        );
      }
    } catch {
      // Ignore
    } finally {
      setSavingRenameId(null);
      handleCancelRename();
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
      <div className="p-4">
        <Link href="/chat" className="block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <Image
            src="/thecouncil.png"
            alt="The Council"
            width={480}
            height={112}
            priority
            className="h-auto w-full"
          />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-2.5 px-3 text-sm font-medium"
          onClick={handleNewChat}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>New Chat</span>
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
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors',
                      conv.id === activeConversationId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/chat/${conv.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      {editingConversationId === conv.id ? (
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const nextFocused = e.relatedTarget as HTMLElement | null;
                            if (nextFocused?.dataset.renameAction === 'cancel') {
                              handleCancelRename();
                              return;
                            }
                            void handleSaveRename(conv.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              handleCancelRename();
                            }
                          }}
                          autoFocus
                          disabled={savingRenameId === conv.id}
                          className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                      ) : (
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{conv.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''} · {conv.mode}
                          </p>
                        </div>
                      )}
                    </button>

                    {editingConversationId === conv.id ? (
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        data-rename-action="cancel"
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        title="Cancel rename"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(e, conv.id, conv.title)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Rename conversation"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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
