export type ConversationMode = 'council' | 'round-robin';

export interface GateDecision {
  agentId: string;
  agentName: string;
  decision: 'yes' | 'no';
  reason: string;
}

export interface InterjectionCooldown {
  agentId: string;
  lastInterjectionAt: number;
}

export interface CouncilSession {
  id: string;
  title: string;
  mode: ConversationMode;
  primaryAgentId: string;
  silentAgentIds: string[];
  cooldowns: InterjectionCooldown[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionConfig {
  mode: ConversationMode;
  primaryAgentId: string;
  agentIds: string[];
  conversationId?: string;
}

export interface AgentStatus {
  agentId: string;
  agentName: string;
  phase: 'idle' | 'thinking' | 'gate-checking' | 'interjecting' | 'responding';
}

export interface InterjectionData {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentColour: string;
  content: string;
}
