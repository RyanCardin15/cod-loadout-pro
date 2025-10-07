import { useEffect, useState } from 'react';
import { OpenAIContext } from './types';

export function useOpenAI(): OpenAIContext {
  const [context, setContext] = useState<OpenAIContext>({
    toolOutput: null,
    callTool: async () => {},
    setWidgetState: async () => {},
    theme: 'light'
  });

  useEffect(() => {
    if (window.openai?.context) {
      setContext(window.openai.context);
    }
  }, []);

  return context;
}