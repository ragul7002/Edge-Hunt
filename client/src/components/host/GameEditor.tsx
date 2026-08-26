import React, { useState, useEffect } from 'react';
import type { Game, Question } from '../../types';
import { api } from '../../services/api';
import { QuestionEditor } from './QuestionEditor';
import { ArrowLeft, Plus, Edit3, Trash2, MoveUp, MoveDown, Settings, HelpCircle, Save } from 'lucide-react';

interface GameEditorProps {
  gameId?: string;
  onGameCreated?: (newGameId: string) => void;
  onBack: () => void;
}

export const GameEditor: React.FC<GameEditorProps> = ({ gameId, onGameCreated, onBack }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null | 'new'>(null);

  // Form fields for Game settings
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [correctPoints, setCorrectPoints] = useState(10);
  const [wrongPoints, setWrongPoints] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showAnswer, setShowAnswer] = useState(true);

  const fetchGameDetails = async (targetId?: string) => {
    const idToFetch = targetId || game?.id || gameId;
    if (!idToFetch) return;
    try {
      const data = await api.getGame(idToFetch);
      setGame(data);
      setName(data.name);
      setDescription(data.description || '');
      setCorrectPoints(data.correctPoints);
      setWrongPoints(data.wrongPoints);
      setSpeedBonus(!!data.speedBonus);
      setAutoAdvance(!!data.autoAdvance);
      setShowAnswer(!!data.showAnswer);
    } catch (err: any) {
      alert('Failed to load game: ' + err.message);
    }
  };

  useEffect(() => {
    setEditingQuestion(null);
    if (gameId) {
      fetchGameDetails(gameId);
    } else {
      setGame(null);
      setName('');
      setDescription('');
      setCorrectPoints(10);
      setWrongPoints(0);
      setSpeedBonus(true);
      setAutoAdvance(false);
      setShowAnswer(true);
    }
  }, [gameId]);

  const handleSaveGameSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        correctPoints: Number(correctPoints),
        wrongPoints: Number(wrongPoints),
        speedBonus,
        autoAdvance,
        showAnswer
      };

      const targetId = game?.id || gameId;
      if (targetId) {
        await api.updateGame(targetId, payload);
        alert('Game settings updated!');
        fetchGameDetails(targetId);
      } else {
        const created = await api.createGame(payload);
        alert('Game created! Now you can add questions.');
        setGame(created);
        if (onGameCreated) {
          onGameCreated(created.id);
        }
      }
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.deleteQuestion(qId);
      fetchGameDetails();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!game?.questions) return;
    const questions = [...game.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const ids = questions.map(q => q.id);
    try {
      await api.reorderQuestions(game.id, ids);
      fetchGameDetails();
    } catch (err: any) {
      alert('Reorder failed: ' + err.message);
    }
  };

  if (editingQuestion !== null) {
    return (
      <QuestionEditor
        gameId={game?.id || gameId || ''}
        question={editingQuestion === 'new' ? null : editingQuestion}
        onSave={() => {
          setEditingQuestion(null);
          fetchGameDetails(game?.id || gameId);
        }}
        onCancel={() => setEditingQuestion(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="font-mono text-xs text-cyan-400 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
          GAME ID: {game?.gameCode || 'NEW GAME'}
        </span>
      </div>

      {/* Game Settings Card */}
      <form onSubmit={handleSaveGameSettings} className="glass-card p-6 border-cyan-500/30 space-y-6">
        <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" /> GAME CONFIGURATION & SCORING
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Game Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Edge Hunter"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of event or quiz topic"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Correct Answer Points
            </label>
            <input
              type="number"
              value={correctPoints}
              onChange={(e) => setCorrectPoints(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Wrong Answer Penalty
            </label>
            <input
              type="number"
              value={wrongPoints}
              onChange={(e) => setWrongPoints(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="speedBonus"
              checked={speedBonus}
              onChange={(e) => setSpeedBonus(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="speedBonus" className="text-xs font-bold text-slate-300 cursor-pointer">
              Enable Speed Bonus (+5 / +3)
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="showAnswer"
              checked={showAnswer}
              onChange={(e) => setShowAnswer(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="showAnswer" className="text-xs font-bold text-slate-300 cursor-pointer">
              Show Answer After Question
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary text-xs">
            <Save className="w-4 h-4" /> SAVE GAME SETTINGS
          </button>
        </div>
      </form>

      {/* Questions Management List */}
      {game && (
        <div className="glass-card p-6 border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" /> QUESTIONS ({game.questions?.length || 0})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Add, edit, or reorder questions. Each question supports 2 to 6 options.
              </p>
            </div>

            <button
              onClick={() => setEditingQuestion('new')}
              className="btn-primary py-2 px-4 text-xs"
            >
              <Plus className="w-4 h-4" /> ADD QUESTION
            </button>
          </div>

          {!game.questions || game.questions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No questions created for this game yet. Click "Add Question" above!
            </div>
          ) : (
            <div className="space-y-4">
              {game.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="font-heading text-base font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
                      Q{idx + 1}
                    </span>

                    {q.image && (
                      <div className="w-16 h-12 rounded-lg bg-black border border-slate-700 overflow-hidden flex-shrink-0">
                        <img src={q.image} alt="Q" className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-slate-200 text-sm line-clamp-1">
                        {q.text}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>{q.options?.length || 0} Options</span>
                        <span>•</span>
                        <span>{q.points} Points</span>
                        <span>•</span>
                        <span>{q.timeLimit > 0 ? `${q.timeLimit}s Timer` : 'No Timer'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={idx === (game.questions?.length || 0) - 1}
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      className="p-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="btn-danger py-1.5 px-3 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
