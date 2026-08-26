import React, { useState, useEffect } from 'react';
import type { Question } from '../../types';
import { soundFx } from '../../services/audio';
import { CheckCircle2, XCircle, Clock, Check } from 'lucide-react';

interface ParticipantGameProps {
  participantName: string;
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onSubmitAnswer: (optionId: string) => void;
  existingAnswer?: { optionId: string; isCorrect?: boolean } | null;
  revealedCorrectOptionId?: string | null;
  isPaused?: boolean;
}

export const ParticipantGame: React.FC<ParticipantGameProps> = ({
  participantName,
  question,
  questionIndex,
  totalQuestions,
  onSubmitAnswer,
  existingAnswer,
  revealedCorrectOptionId,
  isPaused
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(existingAnswer?.optionId || null);
  const [submitted, setSubmitted] = useState<boolean>(!!existingAnswer);
  
  // Timer Countdown
  const [timeLeft, setTimeLeft] = useState<number>(question.timeLimit || 0);

  useEffect(() => {
    // Reset selection state when question changes
    setSelectedOptionId(existingAnswer?.optionId || null);
    setSubmitted(!!existingAnswer);
    setTimeLeft(question.timeLimit || 0);
  }, [question.id, existingAnswer]);

  // Timer Tick interval
  useEffect(() => {
    if (!question.timeLimit || question.timeLimit <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev <= 5) {
          soundFx.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id, question.timeLimit]);

  const handleSelectOption = (optionId: string) => {
    if (submitted || isPaused) return; // Prevent clicking when submitted or paused

    setSelectedOptionId(optionId);
    setSubmitted(true);
    soundFx.playCorrect();

    // Instant touch submission to server
    onSubmitAnswer(optionId);
  };

  // Grid column class selector depending on 2, 3, 4, 5, or 6 options
  const getGridColsClass = (count: number) => {
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    return 'grid-cols-2 sm:grid-cols-3';
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col space-y-3 p-2 sm:p-4">
      {/* Participant Header Status Bar */}
      <div className="glass-card p-2.5 sm:p-3 flex items-center justify-between border-cyan-500/30">
        <div>
          <span className="font-heading text-xs sm:text-sm text-cyan-400 font-bold block">
            QUESTION {questionIndex + 1} OF {totalQuestions}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            PLAYER: <strong className="text-white">{participantName}</strong>
          </span>
        </div>

        {/* Timer Gauge */}
        {question.timeLimit > 0 && (
          <div className={`flex items-center gap-1.5 font-heading font-extrabold text-sm px-2.5 py-1 rounded-lg border ${
            timeLeft <= 5
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
              : 'bg-slate-900 text-cyan-300 border-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>
        )}
      </div>

      {/* Compact Question Card */}
      <div className="glass-card p-3 sm:p-4 border-slate-800 space-y-2 text-center">
        {/* Compact Question Image */}
        {question.image && (
          <div className="w-full max-h-32 sm:max-h-40 rounded-lg bg-black/90 border border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-md">
            <img
              src={question.image}
              alt="Question"
              className="max-h-28 sm:max-h-36 object-contain rounded"
            />
          </div>
        )}

        {/* Question Text */}
        <h2 className="font-heading text-sm sm:text-base font-bold text-white max-w-xl mx-auto line-clamp-2">
          {question.text}
        </h2>
      </div>

      {/* Paused Banner */}
      {isPaused && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 py-2 px-3 rounded-lg text-center text-xs font-heading font-extrabold flex items-center justify-center gap-2 animate-pulse shadow-md">
          <span>⏸️ GAME PAUSED BY HOST</span>
        </div>
      )}

      {/* Answer Submitted Badge */}
      {submitted && !revealedCorrectOptionId && (
        <div className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-1.5 px-3 rounded-lg text-center text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-sm">
          <Check className="w-3.5 h-3.5 text-cyan-400" /> Answer submitted ✓ (Waiting for Host)
        </div>
      )}

      {/* Answer Revealed Result Feedback */}
      {revealedCorrectOptionId && selectedOptionId && (
        <div className={`py-2 px-3 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md ${
          selectedOptionId === revealedCorrectOptionId
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
        }`}>
          {selectedOptionId === revealedCorrectOptionId ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ Correct Answer! Excellent match.</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-pink-400" />
              <span>✗ Incorrect Answer. Keep trying!</span>
            </>
          )}
        </div>
      )}

      {/* 2 to 6 Touchable Option Cards Grid - Compact Fit */}
      <div className={`grid gap-2.5 ${getGridColsClass(question.options.length)}`}>
        {question.options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrect = revealedCorrectOptionId && opt.id === revealedCorrectOptionId;
          const isWrong = revealedCorrectOptionId && isSelected && opt.id !== revealedCorrectOptionId;

          return (
            <div
              key={opt.id}
              onClick={() => handleSelectOption(opt.id)}
              className={`option-card p-2 rounded-xl border ${submitted ? 'locked' : ''} ${
                isSelected ? 'selected' : ''
              } ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
            >
              <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center font-heading text-[10px] font-bold text-slate-300 z-10">
                {idx + 1}
              </div>

              {opt.image && (
                <div className="w-full h-20 sm:h-24 rounded bg-black border border-slate-800/80 overflow-hidden flex items-center justify-center mb-1">
                  <img
                    src={opt.image}
                    alt={opt.text || `Option ${idx + 1}`}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}

              {opt.text && (
                <span className="font-semibold text-slate-200 text-xs text-center line-clamp-1">
                  {opt.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
