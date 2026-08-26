import React, { useState, useEffect } from 'react';
import type { Game } from '../../types';
import { api } from '../../services/api';
import { Plus, Play, Edit3, Copy, Trash2, Eye, Users, HelpCircle, Sparkles } from 'lucide-react';

interface HostDashboardProps {
  onSelectGame: (game: Game, action: 'edit' | 'wait' | 'preview') => void;
  onCreateNewGame: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onSelectGame, onCreateNewGame }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const data = await api.getGames();
      setGames(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.duplicateGame(id);
      fetchGames();
    } catch (err: any) {
      alert('Failed to duplicate game: ' + err.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await api.deleteGame(id);
      fetchGames();
    } catch (err: any) {
      alert('Failed to delete game: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" /> GAME MANAGEMENT DASHBOARD
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Create, configure, and control real-time image quizzes for AI Frontiers events.
          </p>
        </div>

        <button onClick={onCreateNewGame} className="btn-primary">
          <Plus className="w-5 h-5" /> CREATE NEW GAME
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-3"></div>
          Loading game library...
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center text-red-400 border-red-500/30">
          {error}
        </div>
      ) : games.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed border-slate-700">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-heading text-lg text-slate-300 font-bold mb-1">No Games Created Yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Get started by creating your first interactive quiz or load the sample Edge Hunter game.
          </p>
          <button onClick={onCreateNewGame} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Your First Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <div
              key={game.id}
              className="glass-card glass-card-hover p-6 flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-md font-bold tracking-widest">
                    {game.gameCode}
                  </span>
                  <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    game.status === 'live'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                      : game.status === 'waiting'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {game.status}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold text-white mb-2 line-clamp-1">
                  {game.name}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                  {game.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800 pt-3 mb-6">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span>{game.questionsCount || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{game.participantsCount || 0} Joined</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => onSelectGame(game, 'wait')}
                  className="w-full btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black" /> START WAITING ROOM
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onSelectGame(game, 'edit')}
                    className="btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                    title="Edit Game & Questions"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => onSelectGame(game, 'preview')}
                    className="btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                    title="Preview as Participant"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>

                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleDuplicate(game.id, e)}
                      className="w-1/2 btn-secondary py-2 text-xs flex items-center justify-center"
                      title="Duplicate Game"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(game.id, e)}
                      className="w-1/2 btn-danger py-2 text-xs flex items-center justify-center"
                      title="Delete Game"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
