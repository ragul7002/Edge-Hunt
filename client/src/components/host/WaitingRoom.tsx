import React, { useState } from 'react';
import type { Game, Participant } from '../../types';
import { QRModal } from '../common/QRModal';
import { AvatarDisplay } from '../common/AvatarCustomizer';
import { Play, Users, QrCode, ArrowLeft, UserX } from 'lucide-react';

interface WaitingRoomProps {
  game: Game;
  participants: Participant[];
  joinUrl: string;
  onStartGame: () => void;
  onKickParticipant?: (participantId: string) => void;
  onBack: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  game,
  participants,
  joinUrl,
  onStartGame,
  onKickParticipant,
  onBack
}) => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
          LOBBY / WAITING ROOM
        </span>
      </div>

      {/* Hero Banner for Waiting Room */}
      <div className="glass-card p-8 border-cyan-500/30 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

        <h2 className="font-heading text-3xl font-extrabold text-white mb-2">
          {game.name}
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
          Participants can join now using their phone, laptop, or tablet!
        </p>

        <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 border border-cyan-500/40 p-4 rounded-2xl mb-8 shadow-xl shadow-cyan-500/10">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">JOIN GAME ID / ROOM CODE</span>
            <span className="font-heading text-4xl text-cyan-300 font-extrabold tracking-widest">
              {game.gameCode}
            </span>
          </div>

          <button
            onClick={() => setShowQR(true)}
            className="btn-secondary py-3 px-5 text-xs flex items-center gap-2 shrink-0 border-cyan-500/40 text-cyan-300"
          >
            <QrCode className="w-5 h-5 text-cyan-400" /> SHOW QR CODE
          </button>
        </div>

        <div>
          <button
            onClick={onStartGame}
            disabled={participants.length === 0}
            className="btn-primary text-base py-4 px-10 rounded-xl shadow-xl shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6 fill-black" /> START GAME NOW
          </button>
          {participants.length === 0 && (
            <p className="text-xs text-amber-400 mt-2 font-medium">
              Waiting for participants to join before starting...
            </p>
          )}
        </div>
      </div>

      {/* Joined Participants Grid */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> CONNECTED PARTICIPANTS ({participants.length})
          </h3>
          <span className="text-xs text-slate-400">Live updating</span>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No participants in lobby yet. Join at <span className="text-cyan-400 font-mono">{joinUrl}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.map(p => {
              let avatarObj = null;
              if ((p as any).avatarJson) {
                try { avatarObj = JSON.parse((p as any).avatarJson); } catch (e) {}
              }
              return (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-3 rounded-xl flex items-center justify-between gap-2 transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AvatarDisplay avatar={avatarObj} size="sm" />
                    <span className="font-medium text-slate-200 text-sm truncate">{p.name}</span>
                  </div>

                  {onKickParticipant && (
                    <button
                      onClick={() => onKickParticipant(p.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title={`Kick ${p.name} out of game`}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showQR && (
        <QRModal
          joinUrl={joinUrl}
          gameCode={game.gameCode}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
};
