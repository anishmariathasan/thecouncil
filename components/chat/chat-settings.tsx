'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentConfig } from '@/lib/types/agents';
import type { ConversationMode } from '@/lib/types/council';

interface ChatSettingsProps {
  agents: AgentConfig[];
  primaryAgentId: string | null;
  selectedAgentIds: string[];
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  onPrimaryAgentChange: (agentId: string) => void;
  onSelectedAgentIdsChange: (ids: string[]) => void;
}

export function ChatSettings({
  agents,
  primaryAgentId,
  selectedAgentIds,
  mode,
  onModeChange,
  onPrimaryAgentChange,
  onSelectedAgentIdsChange,
}: ChatSettingsProps) {
  const toggleAgent = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      // Don't allow deselecting the primary agent
      if (agentId === primaryAgentId) return;
      onSelectedAgentIdsChange(selectedAgentIds.filter((id) => id !== agentId));
    } else {
      onSelectedAgentIdsChange([...selectedAgentIds, agentId]);
    }
  };

  const handlePrimaryChange = (agentId: string) => {
    onPrimaryAgentChange(agentId);
    // Ensure the new primary is in the selected set
    if (!selectedAgentIds.includes(agentId)) {
      onSelectedAgentIdsChange([...selectedAgentIds, agentId]);
    }
  };

  if (agents.length === 0) return null;

  return (
    <div className="border-b bg-muted/20 px-4 py-2.5">
      <div className="max-w-3xl mx-auto flex items-center gap-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Mode</span>
          <Button
            size="sm"
            variant={mode === 'council' ? 'default' : 'ghost'}
            className="h-7 text-xs px-2.5"
            onClick={() => onModeChange('council')}
          >
            Council
          </Button>
          <Button
            size="sm"
            variant={mode === 'round-robin' ? 'default' : 'ghost'}
            className="h-7 text-xs px-2.5"
            onClick={() => onModeChange('round-robin')}
          >
            Round Robin
          </Button>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Agent chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Agents</span>
          {agents.map((agent) => {
            const isSelected = selectedAgentIds.includes(agent.id);
            const isPrimary = agent.id === primaryAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                onDoubleClick={() => handlePrimaryChange(agent.id)}
                title={
                  isPrimary
                    ? `${agent.name} (Primary) — click to toggle, double-click to set primary`
                    : `${agent.name} — click to toggle, double-click to set primary`
                }
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors border',
                  isSelected
                    ? isPrimary
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted border-border text-foreground'
                    : 'bg-transparent border-border/50 text-muted-foreground opacity-50'
                )}
              >
                <span className="text-sm leading-none">{agent.avatar}</span>
                <span className="font-medium">{agent.name}</span>
                {isPrimary && (
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 leading-none">
                    1st
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
