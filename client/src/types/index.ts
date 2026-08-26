export type GameStatus = 'draft' | 'waiting' | 'live' | 'paused' | 'completed';

export interface Option {
  id: string;
  questionId?: string;
  orderIndex: number;
  image?: string;
  text?: string;
}

export interface Question {
  id: string;
  gameId: string;
  orderIndex: number;
  text: string;
  image?: string;
  points: number;
  timeLimit: number; // in seconds, 0 = no limit
  correctOptionId?: string;
  options: Option[];
}

export interface Game {
  id: string;
  gameCode: string;
  name: string;
  description?: string;
  status: GameStatus;
  currentQuestionIndex: number;
  autoAdvance: boolean;
  correctPoints: number;
  wrongPoints: number;
  speedBonus: boolean;
  showAnswer: boolean;
  createdAt: string;
  questionsCount?: number;
  participantsCount?: number;
  questions?: Question[];
}

export interface Participant {
  id: string;
  gameId: string;
  name: string;
  sessionId: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTimeMs: number;
  joinedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTimeMs: number;
}

export interface QuestionStats {
  totalParticipants: number;
  answeredCount: number;
  notAnsweredCount: number;
  correctCount: number;
  wrongCount: number;
  optionDistribution: Record<string, number>;
}

export interface AnswerAck {
  success: boolean;
  alreadySubmitted?: boolean;
  optionId?: string;
  earnedPoints?: number;
  isCorrect?: boolean;
  error?: string;
}
