export interface OpenAIContext {
  toolOutput?: any;
  callTool: (name: string, args: any) => Promise<any>;
  setWidgetState: (state: any) => Promise<void>;
  theme: 'light' | 'dark';
  user?: {
    id: string;
    name?: string;
  };
}

export interface ToolResult {
  structuredContent?: any;
  content?: Array<{ type: string; text: string }>;
  _meta?: any;
}

declare global {
  interface Window {
    openai?: {
      context: OpenAIContext;
    };
  }
}