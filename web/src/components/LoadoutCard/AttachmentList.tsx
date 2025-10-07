import React from 'react';

interface AttachmentListProps {
  attachments: Array<{
    id: string;
    name: string;
    slot: string;
  }>;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments }) => {
  const slotColors: Record<string, string> = {
    optic: 'bg-blue-500',
    barrel: 'bg-red-500',
    magazine: 'bg-yellow-500',
    underbarrel: 'bg-green-500',
    stock: 'bg-purple-500',
    laser: 'bg-pink-500',
    muzzle: 'bg-orange-500',
    rearGrip: 'bg-indigo-500'
  };

  return (
    <div className="attachment-list">
      <h5 className="text-sm font-semibold text-cod-blue mb-3">ATTACHMENTS</h5>
      <div className="grid grid-cols-1 gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 bg-cod-black/50 rounded-md p-2"
          >
            <div
              className={`w-3 h-3 rounded-full ${slotColors[attachment.slot] || 'bg-gray-500'}`}
            />
            <div className="flex-1">
              <span className="text-white">{attachment.name}</span>
              <span className="text-cod-blue text-sm ml-2">({attachment.slot})</span>
            </div>
          </div>
        ))}
      </div>
      {attachments.length === 0 && (
        <div className="text-gray-400 text-sm italic">No attachments selected</div>
      )}
    </div>
  );
};