import React from 'react';
import type { Game, Question, Participant, LeaderboardEntry, QuestionStats } from '../../types';
import { LiveLeaderboard } from './LiveLeaderboard';
import { Eye, SkipForward, SkipBack, Pause, Play, Square, CheckCircle, Users, BarChart2 } from 'lucide-react';

interface LiveGameHostProps {
  game: Game;
  questions: Question[];
  currentQuestion: Question | null;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  stats: QuestionStats | null;
  revealedCorrectOptionId?: string | null;
  onNavigateQuestion: (index: number) => void;
  onRevealAnswer: () => void;
  onTogglePause: (paused: boolean) => void;
  onEndGame: () => void;
}

export const LiveGameHost: React.FC<LiveGameHostProps> = ({
  game,
  questions,
  currentQuestion,
  participants,
  leaderboard,
  stats,
  revealedCorrectOptionId,
  onNavigateQuestion,
  onRevealAnswer,
  onTogglePause,
  onEndGame
}) => {
  const currentIndex = game.currentQuestionIndex || 0;
  const isPaused = game.status === 'paused';

  return (
    <div className="space-y-6">
      {/* Top Host Status Header */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 border-cyan-500/30">
        <div className="flex items-center gap-4">
          <span className="font-heading text-lg font-bold text-white">
            {game.name}
          </span>
          <span className="font-mono text-xs text-cyan-300 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
            ROOM CODE: {game.gameCode}
          </span>
          <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
            isPaused
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
          }`}>
            {isPaused ? 'PAUSED' : 'LIVE'}
          </span>
        </div>

        {/* Answer Stats Summary Badge */}
        <div className="flex items-center gap-6 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>ANSWERS: <strong className="text-cyan-300 text-sm">{stats?.answeredCount || 0} / {stats?.totalParticipants || participants.length}</strong></span>
          </div>
          {stats && (
            <>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>CORRECT: <strong className="text-sm">{stats.correctCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-pink-400">
                <span>WRONG: <strong className="text-sm">{stats.wrongCount}</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Question & Stats (Left 7 cols), Live Leaderboard (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Current Question & Distribution Stats */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-heading text-sm text-cyan-400 font-bold tracking-wider">
                QUESTION {currentIndex + 1} OF {questions.length}
              </span>
              <span className="text-xs text-slate-400">
                {currentQuestion?.points || 10} Points • {currentQuestion?.timeLimit ? `${currentQuestion.timeLimit}s Timer` : 'No Timer'}
              </span>
            </div>

            {currentQuestion ? (
              <div className="space-y-4">
                {currentQuestion.image && (
                  <div className="w-full max-h-44 rounded-xl bg-black/90 border border-slate-700 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={currentQuestion.image}
                      alt="Question"
                      className="max-h-36 object-contain rounded-lg"
                    />
                  </div>
                )}

                <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                  {currentQuestion.text}
                </h3>

                {revealedCorrectOptionId && (
                  <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl font-heading font-extrabold text-sm flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>CORRECT ANSWER REVEALED: {
                      currentQuestion.options?.find(o => o.id === revealedCorrectOptionId)?.text || 'Correct Option'
                    }</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">No active question</div>
            )}
          </div>

          {/* Option Answer Statistics Bar Chart */}
          {currentQuestion && stats && (
            <div className="glass-card p-5 border-slate-800 space-y-4">
              <h4 className="font-heading text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> LIVE OPTION SELECTION DISTRIBUTION
              </h4>

              <div className="space-y-3">
                {currentQuestion.options?.map((opt, idx) => {
                  const count = stats.optionDistribution[opt.id] || 0;
                  const total = stats.answeredCount || 1;
                  const percentage = Math.round((count / total) * 100);
                  const isCorrectOpt = opt.id === currentQuestion.correctOptionId;

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-300 flex items-center gap-2 truncate max-w-[70%]">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCorrectOpt ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{opt.text || `Option ${idx + 1}`}</span>
                        </span>
                        <span className="font-mono text-cyan-300">{count} votes ({percentage}%)</span>
                      </div>

                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCorrectOpt ? 'bg-emerald-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Host Control Actions Toolbar */}
          <div className="glass-card p-4 border-cyan-500/40 flex flex-wrap items-center justify-center gap-3">
            <button
              disabled={currentIndex <= 0}
              onClick={() => onNavigateQuestion(currentIndex - 1)}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-1.5 disabled:opacity-30"
            >
              <SkipBack className="w-4 h-4" /> PREV QUESTION
            </button>

            <button
              onClick={onRevealAnswer}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-extrabold shadow-amber-500/20"
            >
              <Eye className="w-4 h-4" /> REVEAL ANSWER
            </button>

            <button
              disabled={currentIndex >= questions.length - 1}
              onClick={() => onNavigateQuestion(currentIndex + 1)}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-1.5"
            >
              NEXT QUESTION <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => onTogglePause(!isPaused)}
              className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-1.5"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>

            <button
              onClick={onEndGame}
              className="btn-danger py-2.5 px-4 text-xs flex items-center gap-1.5"
            >
              <Square className="w-4 h-4 fill-current" /> END GAME
            </button>
          </div>
        </div>

        {/* Right Column - LIVE ANIMATED LEADERBOARD */}
        <div className="lg:col-span-5 h-full">
          <LiveLeaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </div>
  );
};
