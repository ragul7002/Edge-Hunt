import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Gamepad2, ArrowRight, Shield } from 'lucide-react';

interface JoinScreenProps {
  onJoin: (gameCode: string, name: string) => void;
  error?: string | null;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin, error }) => {
  const [searchParams] = useSearchParams();
  const [gameCode, setGameCode] = useState(searchParams.get('game') || '');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameCode.trim() || !name.trim()) return;
    onJoin(gameCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 border-cyan-500/40 text-center relative overflow-hidden shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/30">
          <Gamepad2 className="w-8 h-8 text-black font-extrabold" />
        </div>

        <h2 className="font-heading text-2xl font-black text-white mb-1">
          AI FRONTIERS GAME ZONE
        </h2>
        <p className="text-xs text-slate-400 mb-8 font-mono">
          JOIN INTERACTIVE MULTIPLAYER QUIZ
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs mb-6 text-left font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Game ID / Room Code
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="e.g. EDGE-7K92"
              className="text-center font-heading font-extrabold tracking-widest text-lg py-3 text-cyan-300 uppercase"
              required
              maxLength={12}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Participant Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="text-center font-semibold text-base py-3 text-white"
              required
              maxLength={24}
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-4 text-base rounded-xl mt-4 flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30"
          >
            <span>JOIN GAME</span> <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Host Admin Link for quick navigation */}
      <Link
        to="/host"
        className="text-xs text-slate-500 hover:text-cyan-400 font-mono inline-flex items-center gap-1.5 mt-6 transition-colors"
      >
        <Shield className="w-3.5 h-3.5 text-purple-400" /> Switch to Host Admin Dashboard
      </Link>
    </div>
  );
};
