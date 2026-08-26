import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Sparkles } from 'lucide-react';
import { soundFx } from '../../services/audio';

interface HeaderProps {
  title?: string;
  gameCode?: string;
  isHost?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title = 'AI FRONTIERS GAME ZONE', gameCode, isHost }) => {
  const [muted, setMuted] = useState(soundFx.getMuted());

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundFx.setMuted(next);
  };

  return (
    <header className="w-full glass-card px-6 py-4 mb-6 flex flex-wrap items-center justify-between border-b border-cyan-500/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Sparkles className="w-5 h-5 text-black font-bold" />
        </div>
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold tracking-wider neon-cyan">
            {title}
          </h1>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>AI FRONTIERS CLUB</span>
            {isHost && (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> HOST CONTROL
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2 sm:mt-0">
        {gameCode && (
          <div className="bg-slate-900/80 border border-cyan-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono">
            <span className="text-xs text-slate-400">ROOM CODE:</span>
            <span className="font-heading text-sm text-cyan-300 font-extrabold tracking-widest">{gameCode}</span>
          </div>
        )}

        <button
          onClick={toggleMute}
          className="p-2.5 rounded-lg glass-card hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
          title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {muted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
};
