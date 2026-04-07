// =============================================================================
// Copilot Types - OpenClaw AI Copilot 类型定义
// =============================================================================

export type CopilotContextType = 'video' | 'alert' | 'media' | 'dashboard';

export interface CopilotContext {
  type: CopilotContextType;
  data: {
    pageTitle?: string;
    currentItem?: {
      id: string;
      name: string;
      description?: string;
    };
    stats?: {
      totalAlerts?: number;
      unhandledAlerts?: number;
      criticalAlerts?: number;
    };
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface CopilotAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action?: () => void;
  execute: () => void | Promise<void>;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  suggestions?: string[];
  actions?: CopilotAction[];
  metadata?: {
    contextUsed?: boolean;
    executedAction?: string;
  };
}

export interface CopilotSuggestion {
  id: string;
  text: string;
  context: CopilotContextType;
  priority: number;
  condition?: (context: CopilotContext) => boolean;
}

export interface AIActionPayload {
  type: 'filter' | 'navigate' | 'highlight' | 'export' | 'analyze';
  target: string;
  params: Record<string, unknown>;
}

export interface FloatingCopilotProps {
  initialPosition?: { x: number; y: number };
  defaultOpen?: boolean;
}
