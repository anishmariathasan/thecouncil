import type { UIMessage } from 'ai';
import type { GateDecision, AgentStatus, InterjectionData, SessionConfig } from './council';

export interface CouncilDataParts {
  'agent-status': AgentStatus;
  'gate-result': GateDecision;
  'interjection': InterjectionData;
  'mode-info': {
    mode: SessionConfig['mode'];
    primaryAgent: string;
    activeAgents: string[];
  };
  'error': {
    agentId?: string;
    message: string;
  };
}

export type CouncilUIMessage = UIMessage;

export interface ChatRequestBody {
  messages: CouncilUIMessage[];
  sessionConfig: SessionConfig;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url: string;
}
