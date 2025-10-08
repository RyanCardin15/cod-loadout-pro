import React, { useEffect, useState } from 'react';

interface LoadoutCardProps {
  toolOutput?: any;
}

const LoadoutCard: React.FC<LoadoutCardProps> = ({ toolOutput }) => {
  const [loadout, setLoadout] = useState<any>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    const data = toolOutput || openai?.toolOutput;
    if (data) {
      setLoadout(data);
    }
  }, [toolOutput]);

  if (!loadout) {
    return <div className="bg-cod-black text-white p-6">Loading loadout...</div>;
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cod-orange mb-4">
        🎮 Recommended Loadout
      </h1>
      <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-6">
        <pre className="text-sm">{JSON.stringify(loadout, null, 2)}</pre>
      </div>
    </div>
  );
};

export default LoadoutCard;
