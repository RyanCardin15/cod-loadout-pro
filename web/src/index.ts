import React from 'react';
import ReactDOM from 'react-dom/client';

export { LoadoutCard } from './components/LoadoutCard';
export { MetaTierList } from './components/MetaTierList';
export { CounterSuggestions } from './components/CounterSuggestions';
export { MyLoadouts } from './components/MyLoadouts';
export { useOpenAI } from './bridge/hooks';
export type { OpenAIContext } from './bridge/types';

// Export React and ReactDOM for UMD bundle
export { React, ReactDOM };