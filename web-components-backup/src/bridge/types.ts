export type DisplayMode = 'inline' | 'pip' | 'fullscreen';

export interface ToolResult {
  structuredContent?: Record<string, unknown>;
  content?: Array<{ type: string; text: string }>;
  _meta?: Record<string, unknown>;
}

export interface OpenAIContext {
  toolInput: unknown;
  toolOutput: ToolResult | null;
  widgetState: unknown;
  locale?: string;
  theme: 'light' | 'dark' | 'high_contrast';
  displayMode: DisplayMode;
  maxHeight?: number;
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  setWidgetState: (state: unknown) => Promise<void>;
  sendFollowupTurn: (payload: { prompt: string }) => Promise<void>;
  requestDisplayMode: (payload: { mode: DisplayMode }) => Promise<void>;
}

export interface OpenAIHost {
  toolInput?: unknown;
  toolOutput?: ToolResult | null;
  widgetState?: unknown;
  locale?: string;
  theme?: 'light' | 'dark' | 'high_contrast';
  displayMode?: DisplayMode;
  maxHeight?: number;
  callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  setWidgetState?: (state: unknown) => Promise<void>;
  sendFollowupTurn?: (payload: { prompt: string }) => Promise<void>;
  requestDisplayMode?: (payload: { mode: DisplayMode }) => Promise<void>;
  userAgent?: string;
}

declare global {
  interface Window {
    openai?: OpenAIHost;
  }
}
