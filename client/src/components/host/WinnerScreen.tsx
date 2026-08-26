import React, { useEffect } from 'react';
import type { LeaderboardEntry, Game } from '../../types';
import confetti from 'canvas-confetti';
import { soundFx } from '../../services/audio';
import { Trophy, Download, RotateCcw, Home, Award, Medal } from 'lucide-react';

interface WinnerScreenProps {
  game: Game;
  leaderboard: LeaderboardEntry[];
  onRestart: () => void;
  onHome: () => void;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({ game, leaderboard, onRestart, onHome }) => {
  const winner = leaderboard[0];
  const runnerUp = leaderboard[1];
  const thirdPlace = leaderboard[2];

  useEffect(() => {
    // Play winner fanfare
    soundFx.playFanfare();

    // Trigger confetti cannon
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleDownloadExport = (format: 'csv' | 'json') => {
    window.open(`/api/games/${game.id}/export?format=${format}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-center">
      {/* Champion Banner */}
      <div className="glass-card p-10 border-amber-500/50 relative overflow-hidden">
        <div className="inline-flex p-4 rounded-full bg-amber-500/20 text-amber-400 mb-4 shadow-xl shadow-amber-500/20 animate-bounce">
          <Trophy className="w-12 h-12 fill-amber-400/30" />
        </div>

        <span className="font-heading text-xs font-bold text-amber-400 tracking-widest uppercase block mb-1">
          CHAMPION VICTORY
        </span>
        <h2 className="font-heading text-4xl sm:text-5xl font-black text-white neon-cyan mb-3">
          {winner ? winner.name : 'GAME COMPLETED'}
        </h2>
        <div className="font-heading text-2xl font-extrabold text-amber-300">
          {winner ? `${winner.score} POINTS` : ''}
        </div>
      </div>

      {/* Podium Top 3 */}
      {leaderboard.length >= 2 && (
        <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto">
          {/* 2nd Place */}
          {runnerUp ? (
            <div className="glass-card p-4 border-slate-400/40 text-center h-48 flex flex-col justify-end">
              <Medal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span className="font-heading text-xs font-bold text-slate-400 uppercase">2nd Place</span>
              <h4 className="font-bold text-slate-200 text-sm truncate">{runnerUp.name}</h4>
              <span className="font-heading text-cyan-400 font-extrabold text-sm">{runnerUp.score} pts</span>
            </div>
          ) : <div />}

          {/* 1st Place */}
          {winner && (
            <div className="glass-card p-6 border-amber-500/60 text-center h-60 flex flex-col justify-end bg-gradient-to-t from-amber-500/20 to-slate-900/90 shadow-xl shadow-amber-500/20">
              <Trophy className="w-10 h-10 text-amber-400 fill-amber-400/40 mx-auto mb-2 animate-pulse" />
              <span className="font-heading text-xs font-bold text-amber-400 uppercase">1st Winner</span>
              <h3 className="font-bold text-white text-base truncate">{winner.name}</h3>
              <span className="font-heading text-amber-300 font-extrabold text-lg">{winner.score} pts</span>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace ? (
            <div className="glass-card p-4 border-amber-700/40 text-center h-40 flex flex-col justify-end">
              <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <span className="font-heading text-xs font-bold text-amber-600 uppercase">3rd Place</span>
              <h4 className="font-bold text-slate-200 text-sm truncate">{thirdPlace.name}</h4>
              <span className="font-heading text-cyan-400 font-extrabold text-sm">{thirdPlace.score} pts</span>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Complete Summary Results Table */}
      <div className="glass-card p-6 border-slate-800 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-heading text-lg font-bold text-white">
            FINAL RESULTS LEADERBOARD
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadExport('csv')}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-cyan-300 border-cyan-500/40"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>

            <button
              onClick={() => handleDownloadExport('json')}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> JSON Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/90 text-slate-400 font-heading">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Participant Name</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-center">Correct</th>
                <th className="py-3 px-4 text-center">Wrong</th>
                <th className="py-3 px-4 text-right">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {leaderboard.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white">{entry.name}</td>
                  <td className="py-3 px-4 text-right font-heading text-cyan-300 font-extrabold">{entry.score}</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-mono">{entry.correctAnswers}</td>
                  <td className="py-3 px-4 text-center text-pink-400 font-mono">{entry.wrongAnswers}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">{(entry.totalTimeMs / 1000).toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={onHome} className="btn-secondary py-3 px-6 text-xs flex items-center gap-2">
          <Home className="w-4 h-4" /> RETURN TO HOST DASHBOARD
        </button>

        <button onClick={onRestart} className="btn-primary py-3 px-6 text-xs flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> RESTART GAME LOBBY
        </button>
      </div>
    </div>
  );
};
