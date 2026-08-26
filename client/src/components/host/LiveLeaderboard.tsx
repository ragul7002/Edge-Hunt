import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../../types';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import { soundFx } from '../../services/audio';

interface LiveLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  showControls?: boolean;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ leaderboard, showControls = true }) => {
  const [prevLeaderboard, setPrevLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Host Display Preferences
  const [showRank, setShowRank] = useState(true);
  const [showScores, setShowScores] = useState(true);

  useEffect(() => {
    if (prevLeaderboard.length > 0) {
      const changed = new Set<string>();

      leaderboard.forEach((item, newIdx) => {
        const oldIdx = prevLeaderboard.findIndex(p => p.id === item.id);
        const oldItem = prevLeaderboard[oldIdx];

        if (oldItem && (oldItem.score !== item.score || oldIdx !== newIdx)) {
          changed.add(item.id);
          if (oldIdx > newIdx) {
            // Rank went up! Play sound effect
            soundFx.playRankUp();
          }
        }
      });

      if (changed.size > 0) {
        setAnimatingIds(changed);
        const timer = setTimeout(() => setAnimatingIds(new Set()), 1200);
        return () => clearTimeout(timer);
      }
    }
    setPrevLeaderboard(leaderboard);
  }, [leaderboard]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300 fill-slate-300/20" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600 fill-amber-600/20" />;
    return <span className="text-xs font-bold text-slate-400 font-mono">#{rank}</span>;
  };

  return (
    <div className="glass-card p-5 border-cyan-500/30 flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400 animate-bounce" /> LIVE LEADERBOARD
        </h3>

        {showControls && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <button
              onClick={() => setShowRank(!showRank)}
              className={`px-2 py-0.5 rounded border ${showRank ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40' : 'bg-slate-900 border-slate-800'}`}
            >
              Rank
            </button>
            <button
              onClick={() => setShowScores(!showScores)}
              className={`px-2 py-0.5 rounded border ${showScores ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40' : 'bg-slate-900 border-slate-800'}`}
            >
              Scores
            </button>
          </div>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          No participant scores yet.
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
          {leaderboard.map((entry, idx) => {
            const rank = idx + 1;
            const isAnimating = animatingIds.has(entry.id);

            return (
              <div
                key={entry.id}
                className={`leaderboard-row p-3 rounded-xl flex items-center justify-between gap-3 border ${
                  rank === 1
                    ? 'bg-gradient-to-r from-amber-500/10 to-slate-900/80 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : rank === 2
                    ? 'bg-gradient-to-r from-slate-300/10 to-slate-900/80 border-slate-400/30'
                    : rank === 3
                    ? 'bg-gradient-to-r from-amber-700/10 to-slate-900/80 border-amber-700/30'
                    : 'bg-slate-900/60 border-slate-800'
                } ${isAnimating ? 'neon-border-cyan scale-[1.02]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {showRank && (
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      {getRankBadge(rank)}
                    </div>
                  )}

                  <span className="font-semibold text-slate-200 text-sm truncate">
                    {entry.name}
                  </span>
                </div>

                {showScores && (
                  <div className={`text-right shrink-0 ${isAnimating ? 'score-pulse' : ''}`}>
                    <span className="font-heading font-extrabold text-base text-cyan-300">
                      {entry.score}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">pts</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
