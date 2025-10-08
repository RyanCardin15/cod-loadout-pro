import React, { useEffect, useState } from 'react';

interface MyLoadoutsProps {
  toolOutput?: any;
}

const MyLoadouts: React.FC<MyLoadoutsProps> = ({ toolOutput }) => {
  const [loadouts, setLoadouts] = useState<any>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    const data = toolOutput || openai?.toolOutput;
    if (data) {
      setLoadouts(data);
    }
  }, [toolOutput]);

  if (!loadouts) {
    return <div className="bg-cod-black text-white p-6">Loading your loadouts...</div>;
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cod-orange mb-4">
        💾 My Loadouts
      </h1>
      <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-6">
        <pre className="text-sm">{JSON.stringify(loadouts, null, 2)}</pre>
      </div>
    </div>
  );
};

export default MyLoadouts;
