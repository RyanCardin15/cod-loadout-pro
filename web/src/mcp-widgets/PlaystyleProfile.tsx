import React, { useEffect, useState } from 'react';

interface PlaystyleProfileProps {
  toolOutput?: any;
}

const PlaystyleProfile: React.FC<PlaystyleProfileProps> = ({ toolOutput }) => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    const data = toolOutput || openai?.toolOutput;
    if (data) {
      setProfile(data);
    }
  }, [toolOutput]);

  if (!profile) {
    return <div className="bg-cod-black text-white p-6">Loading playstyle...</div>;
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cod-orange mb-4">
        🎯 Playstyle Profile
      </h1>
      <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-6">
        <pre className="text-sm">{JSON.stringify(profile, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PlaystyleProfile;
