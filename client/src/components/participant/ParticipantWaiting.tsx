import React from 'react';
import type { Game } from '../../types';
import { AvatarDisplay, defaultAvatar } from '../common/AvatarCustomizer';
import type { ParticipantAvatar } from '../common/AvatarCustomizer';
import { Clock, Users, Lock } from 'lucide-react';

interface ParticipantWaitingProps {
  participantName: string;
  game: Game;
  lobbyParticipants?: any[];
  currentAvatar?: ParticipantAvatar;
}

export const ParticipantWaiting: React.FC<ParticipantWaitingProps> = ({
  participantName,
  game,
  lobbyParticipants = [],
  currentAvatar = defaultAvatar
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Strict Waiting Banner */}
      <div className="glass-card p-6 border-cyan-500/30 text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase animate-pulse">
          <Lock className="w-4 h-4" /> WAITING FOR HOST PERMISSION TO START
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white neon-cyan">
          YOU ARE IN THE LOBBY
        </h2>
        <p className="text-sm text-slate-300">
          Game: <strong className="text-cyan-300 font-heading">{game.name}</strong> ({game.gameCode})
        </p>

        {/* Participant Avatar & Name Display */}
        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          <AvatarDisplay avatar={currentAvatar} size="xl" />
          <span className="font-heading font-bold text-white text-base">{participantName}</span>
        </div>
      </div>

      {/* Live Joined Waiters List */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> PARTICIPANTS WAITING IN LOBBY ({lobbyParticipants.length || 1})
          </h3>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Live Updates
          </span>
        </div>

        {lobbyParticipants.length === 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <AvatarDisplay avatar={currentAvatar} size="md" />
            <div>
              <span className="font-bold text-white text-sm block">{participantName} (You)</span>
              <span className="text-[11px] text-cyan-400 font-mono">Waiting for Host...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {lobbyParticipants.map((p, idx) => (
              <div
                key={p.id || idx}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  p.name === participantName
                    ? 'bg-cyan-950/60 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <AvatarDisplay avatar={p.avatar} size="sm" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-200 text-xs truncate block">
                    {p.name} {p.name === participantName ? '(You)' : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">Ready</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
