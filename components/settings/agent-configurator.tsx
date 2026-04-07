'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PROVIDERS, getModels, getModel } from '@/lib/providers/provider-registry';
import { AGENT_PRESETS } from '@/lib/agents/presets';
import { nanoid } from 'nanoid';
import type { AgentConfig, ThinkingConfig } from '@/lib/types/agents';
import type { ProviderId } from '@/lib/types/config';

const AGENT_COLOURS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

interface AgentConfiguratorProps {
  agents: AgentConfig[];
  apiKeys: Partial<Record<ProviderId, string>>;
  onAdd: (agent: AgentConfig) => Promise<void>;
  onRemove: (agentId: string) => Promise<void>;
}

export function AgentConfigurator({ agents, apiKeys, onAdd, onRemove }: AgentConfiguratorProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [providerId, setProviderId] = useState<string>('');
  const [modelId, setModelId] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [thinkingValue, setThinkingValue] = useState('');

  const availableProviders = Object.entries(PROVIDERS).filter(
    ([id]) => apiKeys[id as ProviderId]
  );

  const models = providerId ? getModels(providerId) : [];
  const selectedModel = providerId && modelId ? getModel(providerId, modelId) : undefined;
  const thinkingCapability = selectedModel?.thinking ?? selectedModel?.reasoning;

  const handlePreset = (preset: typeof AGENT_PRESETS[number]) => {
    setName(preset.name);
    setRole(preset.role);
    setSystemPrompt(preset.systemPrompt);
    setAvatar(preset.avatar);
  };

  const handleAdd = async () => {
    if (!name || !providerId || !modelId) return;

    const colour = AGENT_COLOURS[agents.length % AGENT_COLOURS.length];

    let thinking: ThinkingConfig | undefined;
    if (thinkingCapability && thinkingValue) {
      thinking = {
        type: thinkingCapability.type,
        value: thinkingCapability.type === 'budget' ? Number(thinkingValue) : thinkingValue,
      };
    }

    const agent: AgentConfig = {
      id: nanoid(),
      name,
      role,
      systemPrompt,
      providerId: providerId as ProviderId,
      modelId,
      colour,
      avatar,
      ...(thinking ? { thinking } : {}),
    };

    await onAdd(agent);
    setOpen(false);
    setName('');
    setRole('');
    setSystemPrompt('');
    setProviderId('');
    setModelId('');
    setAvatar('🤖');
    setThinkingValue('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agents ({agents.length})</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button size="sm" disabled={availableProviders.length === 0} />}
          >
            Add Agent
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Quick start from preset</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AGENT_PRESETS.map((preset) => (
                    <Badge
                      key={preset.name}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handlePreset(preset)}
                    >
                      {preset.avatar} {preset.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                <div>
                  <Label htmlFor="avatar">Avatar</Label>
                  <Input
                    id="avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-16 text-center text-lg"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Research Analyst"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Thorough analysis and evidence assessment"
                />
              </div>

              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select value={providerId} onValueChange={(v) => { setProviderId(v ?? ''); setModelId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map(([id, provider]) => (
                      <SelectItem key={id} value={id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {providerId && models.length > 0 && (
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={modelId} onValueChange={(v) => setModelId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                          {model.context && (
                            <span className="text-muted-foreground ml-1">({model.context})</span>
                          )}
                          <span className="text-muted-foreground ml-1 text-xs">
                            [{model.tier}]
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {thinkingCapability && thinkingCapability.type !== 'budget' && 'values' in thinkingCapability && (
                <div>
                  <Label>
                    {thinkingCapability.type === 'effort' ? 'Reasoning Effort' : 'Thinking Level'}
                  </Label>
                  <Select
                    value={thinkingValue || thinkingCapability.default}
                    onValueChange={(v) => setThinkingValue(v ?? '')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {thinkingCapability.values.map((v: string) => (
                        <SelectItem key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {thinkingCapability && thinkingCapability.type === 'budget' && (
                <div>
                  <Label>Thinking Budget (tokens)</Label>
                  <Input
                    type="number"
                    value={thinkingValue || ''}
                    onChange={(e) => setThinkingValue(e.target.value)}
                    placeholder={`${thinkingCapability.min}–${thinkingCapability.max} (leave blank for default)`}
                    min={thinkingCapability.min}
                    max={thinkingCapability.max}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {thinkingCapability.min.toLocaleString()}–{thinkingCapability.max.toLocaleString()} tokens
                  </p>
                </div>
              )}

              {providerId === 'openrouter' && (
                <div>
                  <Label htmlFor="model-id">Model ID</Label>
                  <Input
                    id="model-id"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="e.g. meta-llama/llama-3.1-405b-instruct"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the OpenRouter model ID. Browse models at openrouter.ai/models
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Instructions for this agent's behaviour..."
                  rows={6}
                />
              </div>

              <Button onClick={handleAdd} disabled={!name || !providerId || !modelId} className="w-full">
                Add Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {availableProviders.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add at least one API key above before configuring agents.
        </p>
      )}

      <div className="space-y-2">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: agent.colour }}
                  >
                    {agent.avatar}
                  </span>
                  <div>
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(agent.id)}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {PROVIDERS[agent.providerId]?.name ?? agent.providerId}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {agent.modelId}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
