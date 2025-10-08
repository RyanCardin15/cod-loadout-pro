import React, { useEffect, useState } from 'react';

interface WeaponListProps {
  toolOutput?: any;
}

const WeaponList: React.FC<WeaponListProps> = ({ toolOutput }) => {
  const [weapons, setWeapons] = useState<any>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    const data = toolOutput || openai?.toolOutput;
    if (data) {
      setWeapons(data);
    }
  }, [toolOutput]);

  if (!weapons) {
    return <div className="bg-cod-black text-white p-6">Loading weapons...</div>;
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cod-orange mb-4">
        🔫 Weapon Recommendations
      </h1>
      <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-6">
        <pre className="text-sm">{JSON.stringify(weapons, null, 2)}</pre>
      </div>
    </div>
  );
};

export default WeaponList;
