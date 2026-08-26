import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { Game, Question, Participant, LeaderboardEntry, QuestionStats } from './types';
import { api } from './services/api';
import { socketService } from './services/socket';
import { Header } from './components/common/Header';
import { HostDashboard } from './components/host/HostDashboard';
import { GameEditor } from './components/host/GameEditor';
import { WaitingRoom } from './components/host/WaitingRoom';
import { LiveGameHost } from './components/host/LiveGameHost';
import { WinnerScreen } from './components/host/WinnerScreen';
import { JoinScreen } from './components/participant/JoinScreen';
import { ParticipantWaiting } from './components/participant/ParticipantWaiting';
import { ParticipantGame } from './components/participant/ParticipantGame';
import './styles/theme.css';

// --- MAIN HOST APP CONTROLLER ---
const HostAppController: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor' | 'waiting' | 'live' | 'winner'>('dashboard');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  // Real-time Host State
  const [hostState, setHostState] = useState<{
    game: Game | null;
    questions: Question[];
    currentQuestion: Question | null;
    participants: Participant[];
    leaderboard: LeaderboardEntry[];
    stats: QuestionStats | null;
  }>({
    game: null,
    questions: [],
    currentQuestion: null,
    participants: [],
    leaderboard: [],
    stats: null
  });

  const [joinUrl, setJoinUrl] = useState<string>('');

  useEffect(() => {
    // Fetch LAN IP info
    api.getIpInfo().then(data => {
      setJoinUrl(data.joinUrl);
    }).catch(() => {
      setJoinUrl(`${window.location.origin}/join`);
    });
  }, []);

  const [revealedCorrectOptionId, setRevealedCorrectOptionId] = useState<string | null>(null);

  // Socket listener for Host State Updates
  useEffect(() => {
    const socket = socketService.getSocket();

    const handleHostStateUpdate = (payload: any) => {
      console.log('[Host] State update received:', payload);
      setHostState({
        game: payload.game,
        questions: payload.questions || [],
        currentQuestion: payload.currentQuestion || null,
        participants: payload.participants || [],
        leaderboard: payload.leaderboard || [],
        stats: payload.stats || null
      });

      if (payload.game?.status === 'completed') {
        setView('winner');
      }
    };

    socket.on('host_state_update', handleHostStateUpdate);
    socket.on('answer_revealed', (data: any) => {
      setRevealedCorrectOptionId(data.correctOptionId);
    });
    socket.on('game_status_changed', (data: any) => {
      setHostState(prev => prev.game ? { ...prev, game: { ...prev.game, status: data.status } } : prev);
    });
    socket.on('game_ended', ({ leaderboard }) => {
      setHostState(prev => ({ ...prev, leaderboard }));
      setView('winner');
    });

    return () => {
      socket.off('host_state_update', handleHostStateUpdate);
      socket.off('answer_revealed');
      socket.off('game_status_changed');
      socket.off('game_ended');
    };
  }, []);

  const handleSelectGame = (game: Game, action: 'edit' | 'wait' | 'preview') => {
    setSelectedGameId(game.id);
    if (action === 'edit') {
      setView('editor');
    } else if (action === 'wait') {
      const socket = socketService.getSocket();
      socket.emit('host_join', { gameId: game.id });
      setView('waiting');
    } else if (action === 'preview') {
      window.open(`/preview?game=${game.id}`, '_blank');
    }
  };

  const handleKickParticipant = (participantId: string) => {
    if (!hostState.game) return;
    const socket = socketService.getSocket();
    socket.emit('host_kick_participant', { gameId: hostState.game.id, participantId });
  };

  const handleStartGame = () => {
    if (!hostState.game) return;
    setRevealedCorrectOptionId(null);
    const socket = socketService.getSocket();
    socket.emit('host_start_game', { gameId: hostState.game.id });
    setView('live');
  };

  const handleNavigateQuestion = (index: number) => {
    if (!hostState.game) return;
    setRevealedCorrectOptionId(null);
    const socket = socketService.getSocket();
    socket.emit('host_navigate_question', { gameId: hostState.game.id, questionIndex: index });
  };

  const handleRevealAnswer = () => {
    if (!hostState.game) return;
    const socket = socketService.getSocket();
    socket.emit('host_reveal_answer', { gameId: hostState.game.id });
  };

  const handleTogglePause = (paused: boolean) => {
    if (!hostState.game) return;
    const socket = socketService.getSocket();
    socket.emit('host_toggle_pause', { gameId: hostState.game.id, paused });
  };

  const handleEndGame = () => {
    if (!hostState.game) return;
    if (!window.confirm('Are you sure you want to end the game?')) return;
    const socket = socketService.getSocket();
    socket.emit('host_end_game', { gameId: hostState.game.id });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <Header
        gameCode={hostState.game?.gameCode}
        isHost={true}
      />

      {view === 'dashboard' && (
        <HostDashboard
          onSelectGame={handleSelectGame}
          onCreateNewGame={() => {
            setSelectedGameId(null);
            setView('editor');
          }}
        />
      )}

      {view === 'editor' && (
        <GameEditor
          gameId={selectedGameId || undefined}
          onGameCreated={(id) => setSelectedGameId(id)}
          onBack={() => setView('dashboard')}
        />
      )}

      {view === 'waiting' && hostState.game && (
        <WaitingRoom
          game={hostState.game}
          participants={hostState.participants}
          joinUrl={`${joinUrl}?game=${hostState.game.gameCode}`}
          onStartGame={handleStartGame}
          onKickParticipant={handleKickParticipant}
          onBack={() => setView('dashboard')}
        />
      )}

      {view === 'live' && hostState.game && (
        <LiveGameHost
          game={hostState.game}
          questions={hostState.questions}
          currentQuestion={hostState.currentQuestion}
          participants={hostState.participants}
          leaderboard={hostState.leaderboard}
          stats={hostState.stats}
          revealedCorrectOptionId={revealedCorrectOptionId}
          onNavigateQuestion={handleNavigateQuestion}
          onRevealAnswer={handleRevealAnswer}
          onTogglePause={handleTogglePause}
          onEndGame={handleEndGame}
        />
      )}

      {view === 'winner' && hostState.game && (
        <WinnerScreen
          game={hostState.game}
          leaderboard={hostState.leaderboard}
          onRestart={() => {
            const socket = socketService.getSocket();
            socket.emit('host_join', { gameId: hostState.game!.id });
            setView('waiting');
          }}
          onHome={() => setView('dashboard')}
        />
      )}
    </div>
  );
};

// --- PARTICIPANT APP CONTROLLER ---
const ParticipantAppController: React.FC = () => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [existingAnswer, setExistingAnswer] = useState<{ optionId: string; isCorrect?: boolean } | null>(null);
  const [revealedCorrectOptionId, setRevealedCorrectOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [lobbyParticipants, setLobbyParticipants] = useState<any[]>([]);
  const [avatar, setAvatar] = useState<any>(null);

  useEffect(() => {
    const socket = socketService.getSocket();

    socket.on('join_success', (data: any) => {
      console.log('[Participant] Join success:', data);
      setParticipant(data.participant);
      setGame(data.game);
      setCurrentQuestion(data.currentQuestion);
      setExistingAnswer(data.existingAnswer);
      if (data.participant?.avatar) {
        setAvatar(data.participant.avatar);
      }
      setError(null);
    });

    socket.on('join_error', (msg: string) => {
      setError(msg);
    });

    socket.on('lobby_participants_updated', (data: any) => {
      if (data.participants) {
        setLobbyParticipants(data.participants);
      }
    });

    socket.on('game_started', (data: any) => {
      console.log('[Participant] Game started:', data);
      setCurrentQuestion(data.question);
      setExistingAnswer(null);
      setRevealedCorrectOptionId(null);
      setGame(prev => prev ? { ...prev, status: 'live', currentQuestionIndex: 0 } : null);
    });

    socket.on('question_changed', (data: any) => {
      console.log('[Participant] Question changed:', data);
      setCurrentQuestion(data.question);
      setExistingAnswer(null);
      setRevealedCorrectOptionId(null);
      setGame(prev => prev ? { ...prev, currentQuestionIndex: data.currentQuestionIndex } : null);
    });

    socket.on('participant_kicked', (data: any) => {
      setParticipant(prev => {
        if (prev && prev.id === data.participantId) {
          setGame(null);
          setError('You have been removed from the lobby by the Host.');
          return null;
        }
        return prev;
      });
    });

    socket.on('answer_revealed', (data: any) => {
      setRevealedCorrectOptionId(data.correctOptionId);
    });

    socket.on('game_ended', () => {
      setGameEnded(true);
    });

    return () => {
      socket.off('join_success');
      socket.off('join_error');
      socket.off('lobby_participants_updated');
      socket.off('participant_kicked');
      socket.off('game_started');
      socket.off('question_changed');
      socket.off('answer_revealed');
      socket.off('game_ended');
    };
  }, []);

  const handleJoinGame = (gameCode: string, name: string) => {
    const socket = socketService.getSocket();
    socket.emit('participant_join', { gameCode, name });
  };

  const handleSubmitAnswer = (optionId: string) => {
    if (!game || !participant || !currentQuestion) return;
    const socket = socketService.getSocket();
    socket.emit('submit_answer', {
      gameId: game.id,
      participantId: participant.id,
      questionId: currentQuestion.id,
      optionId
    });
  };

  if (!participant || !game) {
    return <JoinScreen onJoin={handleJoinGame} error={error} />;
  }

  if (gameEnded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center border-cyan-500/30 space-y-4">
          <h2 className="font-heading text-2xl font-bold text-white neon-cyan">
            GAME COMPLETED
          </h2>
          <p className="text-slate-300 text-sm">
            Thank you for participating in <strong className="text-cyan-300 font-heading">{game.name}</strong>!
          </p>
          <p className="text-xs text-slate-400">
            The Host is displaying the final live leaderboard and winners on the main screen.
          </p>
        </div>
      </div>
    );
  }

  if (game.status === 'draft' || game.status === 'waiting' || !currentQuestion) {
    return (
      <ParticipantWaiting
        participantName={participant.name}
        game={game}
        lobbyParticipants={lobbyParticipants}
        currentAvatar={avatar}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <Header title="AI FRONTIERS GAME ZONE" gameCode={game.gameCode} />
      <ParticipantGame
        participantName={participant.name}
        question={currentQuestion}
        questionIndex={game.currentQuestionIndex || 0}
        totalQuestions={game.questionsCount || 5}
        onSubmitAnswer={handleSubmitAnswer}
        existingAnswer={existingAnswer}
        revealedCorrectOptionId={revealedCorrectOptionId}
        isPaused={game.status === 'paused'}
      />
    </div>
  );
};

// --- MAIN APP ROUTER ---
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/host" element={<HostAppController />} />
        <Route path="/join" element={<ParticipantAppController />} />
        <Route path="/preview" element={<ParticipantAppController />} />
        <Route path="*" element={<ParticipantAppController />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
