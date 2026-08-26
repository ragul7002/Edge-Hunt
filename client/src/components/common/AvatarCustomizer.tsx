import React, { useState } from 'react';
import { Palette, Sparkles, Smile, Shirt } from 'lucide-react';

export interface ParticipantAvatar {
  color: string;
  icon: string;
  hat: string;
  glasses: string;
  outfit: string;
}

export const defaultAvatar: ParticipantAvatar = {
  color: '#00f3ff',
  icon: '🤖',
  hat: 'none',
  glasses: 'none',
  outfit: 'none'
};

const COLOR_OPTIONS = [
  '#00f3ff', // Cyan
  '#8a2be2', // Purple
  '#00ff88', // Emerald
  '#ff007f', // Pink
  '#ffaa00', // Amber
  '#3b82f6', // Blue
  '#ef4444'  // Red
];

const BASE_ICONS = [
  { id: '🤖', label: 'Robot' },
  { id: '👾', label: 'Alien' },
  { id: '🦸', label: 'Hero' },
  { id: '🧙', label: 'Wizard' },
  { id: '🥷', label: 'Ninja' },
  { id: '🧑‍🔬', label: 'Scientist' },
  { id: '🐱', label: 'CyberCat' },
  { id: '🦊', label: 'CyberFox' }
];

const HATS = [
  { id: 'none', label: 'None', emoji: '' },
  { id: '👑', label: 'Crown', emoji: '👑' },
  { id: '🤠', label: 'Cowboy', emoji: '🤠' },
  { id: '🥳', label: 'Party', emoji: '🥳' },
  { id: '🎩', label: 'Top Hat', emoji: '🎩' },
  { id: '🧢', label: 'Cap', emoji: '🧢' },
  { id: '🪖', label: 'Helmet', emoji: '🪖' }
];

const EYEWEAR = [
  { id: 'none', label: 'None', emoji: '' },
  { id: '🕶️', label: 'Sunglasses', emoji: '🕶️' },
  { id: '🥽', label: 'VR Goggles', emoji: '🥽' },
  { id: '👓', label: 'Glasses', emoji: '👓' },
  { id: '⚡', label: 'Visor', emoji: '⚡' }
];

const OUTFITS = [
  { id: 'none', label: 'None', emoji: '' },
  { id: '👔', label: 'Suit', emoji: '👔' },
  { id: '🧥', label: 'Hoodie', emoji: '🧥' },
  { id: '👩‍🚀', label: 'Space Suit', emoji: '👩‍🚀' },
  { id: '🦹', label: 'Hero Cape', emoji: '🦹' },
  { id: '🛡️', label: 'Armor', emoji: '🛡️' }
];

interface AvatarDisplayProps {
  avatar?: ParticipantAvatar | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ avatar = defaultAvatar, size = 'md' }) => {
  const current = avatar || defaultAvatar;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-28 h-28 text-5xl'
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg ${sizeClasses[size]}`}
      style={{ backgroundColor: current.color || '#00f3ff' }}
    >
      {/* Hat Layer */}
      {current.hat && current.hat !== 'none' && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm sm:text-base drop-shadow z-20">
          {current.hat}
        </span>
      )}

      {/* Base Icon */}
      <span className="z-10 drop-shadow">{current.icon || '🤖'}</span>

      {/* Eyewear Layer */}
      {current.glasses && current.glasses !== 'none' && (
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs sm:text-sm z-20 pointer-events-none">
          {current.glasses}
        </span>
      )}

      {/* Outfit Layer */}
      {current.outfit && current.outfit !== 'none' && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs sm:text-sm z-20">
          {current.outfit}
        </span>
      )}
    </div>
  );
};

interface AvatarCustomizerProps {
  avatar: ParticipantAvatar;
  onChange: (updated: ParticipantAvatar) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ avatar, onChange }) => {
  const [activeTab, setActiveTab] = useState<'color' | 'face' | 'hat' | 'glasses' | 'outfit'>('color');

  const updateField = (field: keyof ParticipantAvatar, value: string) => {
    onChange({
      ...avatar,
      [field]: value
    });
  };

  return (
    <div className="glass-card p-5 border-cyan-500/30 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="font-heading text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> CUSTOMIZE YOUR LOBBY AVATAR
        </h4>
        <AvatarDisplay avatar={avatar} size="md" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('color')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
            activeTab === 'color' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Color
        </button>
        <button
          onClick={() => setActiveTab('face')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
            activeTab === 'face' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Smile className="w-3.5 h-3.5" /> Face
        </button>
        <button
          onClick={() => setActiveTab('hat')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
            activeTab === 'hat' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          🧢 Hats
        </button>
        <button
          onClick={() => setActiveTab('glasses')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
            activeTab === 'glasses' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          🕶️ Glasses
        </button>
        <button
          onClick={() => setActiveTab('outfit')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shrink-0 ${
            activeTab === 'outfit' ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" /> Dress
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'color' && (
          <div className="flex items-center gap-3 justify-center">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                onClick={() => updateField('color', c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  avatar.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {activeTab === 'face' && (
          <div className="grid grid-cols-4 gap-2">
            {BASE_ICONS.map(i => (
              <button
                key={i.id}
                onClick={() => updateField('icon', i.id)}
                className={`p-2 rounded-xl text-2xl border transition-all ${
                  avatar.icon === i.id ? 'bg-cyan-950 border-cyan-400 scale-105' : 'bg-slate-900 border-slate-800'
                }`}
              >
                {i.id}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'hat' && (
          <div className="grid grid-cols-4 gap-2">
            {HATS.map(h => (
              <button
                key={h.id}
                onClick={() => updateField('hat', h.id)}
                className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                  avatar.hat === h.id ? 'bg-cyan-950 border-cyan-400 text-cyan-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-xl">{h.emoji || '❌'}</span>
                <span>{h.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'glasses' && (
          <div className="grid grid-cols-4 gap-2">
            {EYEWEAR.map(g => (
              <button
                key={g.id}
                onClick={() => updateField('glasses', g.id)}
                className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                  avatar.glasses === g.id ? 'bg-cyan-950 border-cyan-400 text-cyan-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-xl">{g.emoji || '❌'}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'outfit' && (
          <div className="grid grid-cols-4 gap-2">
            {OUTFITS.map(o => (
              <button
                key={o.id}
                onClick={() => updateField('outfit', o.id)}
                className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                  avatar.outfit === o.id ? 'bg-cyan-950 border-cyan-400 text-cyan-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-xl">{o.emoji || '❌'}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
