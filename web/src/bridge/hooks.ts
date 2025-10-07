import { useEffect, useState } from 'react';
import { OpenAIContext, OpenAIHost } from './types';

const noopAsync = async () => {};

function hydrateFromHost(host?: OpenAIHost): OpenAIContext {
  return {
    toolInput: host?.toolInput ?? null,
    toolOutput: host?.toolOutput ?? null,
    widgetState: host?.widgetState ?? null,
    locale: host?.locale,
    theme: host?.theme ?? 'light',
    displayMode: host?.displayMode ?? 'inline',
    maxHeight: host?.maxHeight,
    callTool: host?.callTool ?? noopAsync,
    setWidgetState: host?.setWidgetState ?? noopAsync,
    sendFollowupTurn: host?.sendFollowupTurn ?? noopAsync,
    requestDisplayMode: host?.requestDisplayMode ?? noopAsync,
  };
}

export function useOpenAI(): OpenAIContext {
  const [context, setContext] = useState<OpenAIContext>(() => hydrateFromHost(typeof window !== 'undefined' ? window.openai : undefined));

  useEffect(() => {
    const updateFromHost = (host?: OpenAIHost) => {
      setContext((prev) => ({
        ...prev,
        ...hydrateFromHost(host ?? window.openai),
      }));
    };

    updateFromHost(window.openai);

    const handleGlobals = (event: Event) => {
      const detail = (event as CustomEvent<OpenAIHost | undefined>).detail;
      updateFromHost(detail ?? window.openai);
    };

    window.addEventListener('openai:set_globals', handleGlobals as EventListener);
    window.addEventListener('openai:tool_response', handleGlobals as EventListener);

    return () => {
      window.removeEventListener('openai:set_globals', handleGlobals as EventListener);
      window.removeEventListener('openai:tool_response', handleGlobals as EventListener);
    };
  }, []);

  return context;
}
