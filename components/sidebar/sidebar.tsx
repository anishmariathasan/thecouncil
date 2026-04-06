'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AgentConfig } from '@/lib/types/agents';
import type { ConversationMode } from '@/lib/types/council';
import { cn } from '@/lib/utils';

interface SidebarProps {
  agents: AgentConfig[];
  primaryAgentId: string | null;
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  onPrimaryAgentChange: (agentId: string) => void;
}

export function Sidebar({
  agents,
  primaryAgentId,
  mode,
  onModeChange,
  onPrimaryAgentChange,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full w-64 border-r bg-muted/30">
      <div className="p-4">
        <Link href="/chat">
          <h1 className="text-lg font-bold">The Council</h1>
        </Link>
      </div>

      <Separator />

      <div className="p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === 'council' ? 'default' : 'ghost'}
            className="flex-1 text-xs"
            onClick={() => onModeChange('council')}
          >
            Council
          </Button>
          <Button
            size="sm"
            variant={mode === 'round-robin' ? 'default' : 'ghost'}
            className="flex-1 text-xs"
            onClick={() => onModeChange('round-robin')}
          >
            Round Robin
          </Button>
        </div>
      </div>

      <Separator />

      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Agents ({agents.length})
        </p>
        <ScrollArea className="flex-1">
          <div className="space-y-1.5">
            {agents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No agents configured.{' '}
                <Link href="/settings" className="text-primary underline">
                  Add agents
                </Link>
              </p>
            ) : (
              agents.map((agent) => {
                const isPrimary = agent.id === primaryAgentId;
                return (
                  <button
                    key={agent.id}
                    onClick={() => onPrimaryAgentChange(agent.id)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      isPrimary
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <span className="text-base">{agent.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                    </div>
                    {isPrimary && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        Primary
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto p-4">
        <Separator className="mb-4" />
        <Link href="/settings">
          <Button variant="outline" size="sm" className="w-full">
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
