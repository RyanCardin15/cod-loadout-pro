import React, { useEffect, useState } from 'react';

interface CounterSuggestionsProps {
  toolOutput?: any;
}

const CounterSuggestions: React.FC<CounterSuggestionsProps> = ({ toolOutput }) => {
  const [counters, setCounters] = useState<any>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    const data = toolOutput || openai?.toolOutput;
    if (data) {
      setCounters(data);
    }
  }, [toolOutput]);

  if (!counters) {
    return <div className="bg-cod-black text-white p-6">Loading counters...</div>;
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cod-orange mb-4">
        ⚔️ Counter Strategies
      </h1>
      <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-6">
        <pre className="text-sm">{JSON.stringify(counters, null, 2)}</pre>
      </div>
    </div>
  );
};

export default CounterSuggestions;
