'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PROVIDERS } from '@/lib/providers/provider-registry';
import type { ProviderId } from '@/lib/types/config';

interface ApiKeyManagerProps {
  apiKeys: Partial<Record<ProviderId, string>>;
  onSave: (providerId: ProviderId, apiKey: string) => Promise<void>;
  onRemove: (providerId: ProviderId) => Promise<void>;
  onTest: (providerId: ProviderId, apiKey: string) => Promise<{ success: boolean; error?: string }>;
}

const PROVIDER_INFO: Record<string, { description: string; placeholder: string; mark: string }> = {
  openai: {
    description: 'Access GPT-5.4, o3, o4-mini and more',
    placeholder: 'sk-...',
    mark: 'OA',
  },
  anthropic: {
    description: 'Access Claude Opus 4.6, Sonnet 4.6, Haiku 4.5',
    placeholder: 'sk-ant-...',
    mark: 'A',
  },
  google: {
    description: 'Access Gemini 3.1 Pro, Flash, and more',
    placeholder: 'AI...',
    mark: 'G',
  },
  openrouter: {
    description: 'Access 300+ models via a single key',
    placeholder: 'sk-or-...',
    mark: 'OR',
  },
};

export function ApiKeyManager({ apiKeys, onSave, onRemove, onTest }: ApiKeyManagerProps) {
  const [editingKeys, setEditingKeys] = useState<Partial<Record<string, string>>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const handleSave = async (providerId: ProviderId) => {
    const key = editingKeys[providerId];
    if (!key?.trim()) return;
    await onSave(providerId, key.trim());
    setEditingKeys((prev) => ({ ...prev, [providerId]: undefined }));
  };

  const handleTest = async (providerId: ProviderId) => {
    const key = editingKeys[providerId];
    if (!key?.trim()) return;
    setTestingProvider(providerId);
    try {
      const result = await onTest(providerId, key.trim());
      setTestResults((prev) => ({ ...prev, [providerId]: result }));
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {Object.entries(PROVIDERS).map(([id, provider]) => {
        const info = PROVIDER_INFO[id];
        const maskedKey = apiKeys[id as ProviderId];
        const isEditing = editingKeys[id] !== undefined;
        const testResult = testResults[id];

        return (
          <Card key={id} className="rounded-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-border/70">
                    {info?.mark}
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <CardDescription>{info?.description}</CardDescription>
                  </div>
                </div>
                {maskedKey && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing || !maskedKey ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`key-${id}`}>API Key</Label>
                    <Input
                      id={`key-${id}`}
                      type="password"
                      placeholder={info?.placeholder}
                      value={editingKeys[id] ?? ''}
                      onChange={(e) =>
                        setEditingKeys((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(id as ProviderId)}
                      disabled={!editingKeys[id]?.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTest(id as ProviderId)}
                      disabled={!editingKeys[id]?.trim() || testingProvider === id}
                      variant="outline"
                    >
                      {testingProvider === id ? 'Testing...' : 'Test key'}
                    </Button>
                    {maskedKey && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditingKeys((prev) => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                          })
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                  {testResult && (
                    <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.success ? 'Key is valid.' : `Error: ${testResult.error}`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <code className="min-w-0 truncate rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground">
                    {maskedKey}
                  </code>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKeys((prev) => ({ ...prev, [id]: '' }))}
                    >
                      Change
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemove(id as ProviderId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
