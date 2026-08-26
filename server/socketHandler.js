const { dbGet, dbAll, dbRun } = require('./database');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // --- HOST EVENTS ---

    // Host registers for a specific game ID
    socket.on('host_join', async ({ gameId }) => {
      try {
        const game = await dbGet('SELECT * FROM games WHERE id = ? OR gameCode = ?', [gameId, gameId]);
        if (!game) {
          socket.emit('error_msg', 'Game not found');
          return;
        }

        const realGameId = game.id;
        socket.join(`host_${realGameId}`);
        socket.data.isHost = true;
        socket.data.gameId = realGameId;

        console.log(`[Socket] Host joined room host_${realGameId}`);

        // Send current game state & participants & leaderboard
        await sendHostFullState(io, socket, realGameId);
      } catch (err) {
        console.error('Error in host_join:', err);
        socket.emit('error_msg', 'Failed to join as host');
      }
    });

    // Host starts game
    socket.on('host_start_game', async ({ gameId }) => {
      try {
        const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
        if (!game) return;

        const now = Date.now();
        await dbRun(
          'UPDATE games SET status = ?, currentQuestionIndex = 0, questionStartTime = ? WHERE id = ?',
          ['live', now, game.id]
        );

        // Fetch Question 0
        const question = await getQuestionWithOpts(game.id, 0);

        // Notify Host
        await sendHostFullState(io, null, game.id);

        // Notify Participants
        io.to(`participant_${game.id}`).emit('game_started', {
          currentQuestionIndex: 0,
          question: sanitizeQuestionForParticipant(question),
          startTime: now
        });
      } catch (err) {
        console.error('Error in host_start_game:', err);
      }
    });

    // Host navigates to question
    socket.on('host_navigate_question', async ({ gameId, questionIndex }) => {
      try {
        const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
        if (!game) return;

        const questionsCountRow = await dbGet('SELECT COUNT(*) as cnt FROM questions WHERE gameId = ?', [game.id]);
        if (questionIndex < 0 || questionIndex >= questionsCountRow.cnt) return;

        const now = Date.now();
        await dbRun(
          'UPDATE games SET currentQuestionIndex = ?, questionStartTime = ? WHERE id = ?',
          [questionIndex, now, game.id]
        );

        const question = await getQuestionWithOpts(game.id, questionIndex);

        // Notify Host
        await sendHostFullState(io, null, game.id);

        // Notify Participants
        io.to(`participant_${game.id}`).emit('question_changed', {
          currentQuestionIndex: questionIndex,
          question: sanitizeQuestionForParticipant(question),
          startTime: now
        });
      } catch (err) {
        console.error('Error in host_navigate_question:', err);
      }
    });

    // Host reveals current question answer
    socket.on('host_reveal_answer', async ({ gameId }) => {
      try {
        const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
        if (!game) return;

        const question = await getQuestionWithOpts(game.id, game.currentQuestionIndex);
        if (!question) return;

        // Broadcast correct option to both Host and Participants
        io.to(`host_${game.id}`).emit('answer_revealed', {
          questionId: question.id,
          correctOptionId: question.correctOptionId
        });

        if (game.showAnswer) {
          io.to(`participant_${game.id}`).emit('answer_revealed', {
            questionId: question.id,
            correctOptionId: question.correctOptionId
          });
        }
      } catch (err) {
        console.error('Error in host_reveal_answer:', err);
      }
    });

    // Host pauses or resumes game
    socket.on('host_toggle_pause', async ({ gameId, paused }) => {
      try {
        const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
        if (!game) return;

        const newStatus = paused ? 'paused' : 'live';
        await dbRun('UPDATE games SET status = ? WHERE id = ?', [newStatus, game.id]);

        io.to(`host_${game.id}`).emit('game_status_changed', { status: newStatus });
        io.to(`participant_${game.id}`).emit('game_status_changed', { status: newStatus });

        await sendHostFullState(io, null, game.id);
      } catch (err) {
        console.error('Error in host_toggle_pause:', err);
      }
    });

    // Host ends game
    socket.on('host_end_game', async ({ gameId }) => {
      try {
        const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
        if (!game) return;

        await dbRun('UPDATE games SET status = ? WHERE id = ?', ['completed', game.id]);

        const leaderboard = await getLeaderboard(game.id);

        io.to(`host_${game.id}`).emit('game_ended', { leaderboard });
        io.to(`participant_${game.id}`).emit('game_ended', { message: 'Game has ended! Thank you for playing.' });
      } catch (err) {
        console.error('Error in host_end_game:', err);
      }
    });

    // --- PARTICIPANT EVENTS ---

    // Participant joins waiting room / game session
    socket.on('participant_join', async ({ gameCode, name, avatar, sessionId }) => {
      try {
        const cleanCode = (gameCode || '').trim().toUpperCase();
        const cleanName = (name || '').trim();

        if (!cleanCode || !cleanName) {
          socket.emit('join_error', 'Game ID and Participant Name are required.');
          return;
        }

        const game = await dbGet('SELECT * FROM games WHERE gameCode = ? OR id = ?', [cleanCode, cleanCode]);
        if (!game) {
          socket.emit('join_error', 'Invalid Game ID. Please check the code and try again.');
          return;
        }

        if (game.status === 'completed') {
          socket.emit('join_error', 'This game has already ended.');
          return;
        }

        // Upsert participant
        const pid = `p_${game.id}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const existingP = await dbGet('SELECT * FROM participants WHERE id = ?', [pid]);

        const joinedAt = new Date().toISOString();
        const avatarStr = avatar ? JSON.stringify(avatar) : (existingP?.avatarJson || null);

        if (!existingP) {
          await dbRun(
            'INSERT INTO participants (id, gameId, name, sessionId, avatarJson, score, correctAnswers, wrongAnswers, totalTimeMs, joinedAt) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)',
            [pid, game.id, cleanName, sessionId || socket.id, avatarStr, joinedAt]
          );
        } else {
          await dbRun('UPDATE participants SET sessionId = ?, avatarJson = COALESCE(?, avatarJson) WHERE id = ?', [sessionId || socket.id, avatarStr, pid]);
        }

        socket.data.participantId = pid;
        socket.data.gameId = game.id;
        socket.data.isParticipant = true;
        socket.join(`participant_${game.id}`);

        console.log(`[Socket] Participant ${cleanName} (${pid}) joined game ${game.gameCode}`);

        // Only send question if game is actually LIVE
        const isLive = game.status === 'live';
        const currentQ = isLive ? await getQuestionWithOpts(game.id, game.currentQuestionIndex) : null;
        const participantObj = await dbGet('SELECT * FROM participants WHERE id = ?', [pid]);
        if (participantObj && participantObj.avatarJson) {
          try { participantObj.avatar = JSON.parse(participantObj.avatarJson); } catch (e) {}
        }

        // Check if participant already answered current question
        let existingAnswer = null;
        if (currentQ) {
          existingAnswer = await dbGet('SELECT * FROM answers WHERE participantId = ? AND questionId = ?', [pid, currentQ.id]);
        }

        socket.emit('join_success', {
          participant: participantObj,
          game: {
            id: game.id,
            gameCode: game.gameCode,
            name: game.name,
            status: game.status,
            currentQuestionIndex: game.currentQuestionIndex,
            autoAdvance: !!game.autoAdvance
          },
          currentQuestion: isLive ? sanitizeQuestionForParticipant(currentQ) : null,
          existingAnswer: existingAnswer ? { optionId: existingAnswer.optionId, isCorrect: existingAnswer.isCorrect } : null,
          questionStartTime: game.questionStartTime
        });

        // Broadcast updated participant list to ALL waiting participants
        await broadcastLobbyParticipants(io, game.id);

        // Notify Host that a participant joined
        await sendHostFullState(io, null, game.id);
      } catch (err) {
        console.error('Error in participant_join:', err);
        socket.emit('join_error', 'Failed to join game room.');
      }
    });

    // Host kicks out participant
    socket.on('host_kick_participant', async ({ gameId, participantId }) => {
      try {
        if (!gameId || !participantId) return;

        await dbRun('DELETE FROM participants WHERE id = ? AND gameId = ?', [participantId, gameId]);
        await dbRun('DELETE FROM answers WHERE participantId = ?', [participantId]);

        // Notify kicked participant
        io.to(`participant_${gameId}`).emit('participant_kicked', { participantId });

        // Broadcast updated list
        await broadcastLobbyParticipants(io, gameId);
        await sendHostFullState(io, null, gameId);
        console.log(`[Kick] Participant ${participantId} kicked from game ${gameId}`);
      } catch (err) {
        console.error('Error in host_kick_participant:', err);
      }
    });

    // Participant updates avatar in waiting room
    socket.on('update_avatar', async ({ gameId, participantId, avatar }) => {
      try {
        if (!gameId || !participantId || !avatar) return;
        const avatarStr = JSON.stringify(avatar);
        await dbRun('UPDATE participants SET avatarJson = ? WHERE id = ?', [avatarStr, participantId]);

        // Broadcast to all participants and host
        await broadcastLobbyParticipants(io, gameId);
        await sendHostFullState(io, null, gameId);
      } catch (err) {
        console.error('Error in update_avatar:', err);
      }
    });

    // Participant submits answer
    socket.on('submit_answer', async ({ gameId, participantId, questionId, optionId }) => {
      try {
        if (!participantId || !questionId || !optionId) return;

        const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
        if (!game || game.status !== 'live') return;

        const question = await dbGet('SELECT * FROM questions WHERE id = ?', [questionId]);
        if (!question) return;

        // Prevent duplicate answers
        const existing = await dbGet('SELECT * FROM answers WHERE participantId = ? AND questionId = ?', [participantId, questionId]);
        if (existing) {
          socket.emit('answer_ack', { success: true, alreadySubmitted: true, optionId: existing.optionId });
          return;
        }

        const isCorrect = (optionId === question.correctOptionId) ? 1 : 0;
        const now = Date.now();
        const responseTimeMs = game.questionStartTime ? Math.max(0, now - game.questionStartTime) : 0;

        // Calculate points & speed bonus
        let basePoints = isCorrect ? (question.points || game.correctPoints || 10) : (game.wrongPoints || 0);
        let speedBonusPoints = 0;

        if (isCorrect && game.speedBonus && question.timeLimit > 0) {
          const timeLimitMs = question.timeLimit * 1000;
          const ratio = responseTimeMs / timeLimitMs;
          if (ratio <= 0.2) speedBonusPoints = 5;
          else if (ratio <= 0.5) speedBonusPoints = 3;
        }

        const totalEarnedPoints = basePoints + speedBonusPoints;

        // Record Answer
        const answerId = `ans_${participantId}_${questionId}`;
        const createdAt = new Date().toISOString();
        await dbRun(
          'INSERT INTO answers (id, participantId, questionId, optionId, isCorrect, points, responseTimeMs, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [answerId, participantId, questionId, optionId, isCorrect, totalEarnedPoints, responseTimeMs, createdAt]
        );

        // Update Participant Score & Stats
        await dbRun(
          `UPDATE participants 
           SET score = score + ?, 
               correctAnswers = correctAnswers + ?, 
               wrongAnswers = wrongAnswers + ?, 
               totalTimeMs = totalTimeMs + ? 
           WHERE id = ?`,
          [totalEarnedPoints, isCorrect ? 1 : 0, isCorrect ? 0 : 1, responseTimeMs, participantId]
        );

        // Send ACK to participant
        socket.emit('answer_ack', {
          success: true,
          optionId,
          earnedPoints: totalEarnedPoints,
          isCorrect: game.showAnswer ? isCorrect : undefined
        });

        // Broadcast to HOST ONLY: updated stats & animated leaderboard
        await sendHostFullState(io, null, game.id, question.id);

        console.log(`[Answer] Participant ${participantId} answered Q:${questionId} -> Option:${optionId} (Correct:${isCorrect}, Points:${totalEarnedPoints})`);
      } catch (err) {
        console.error('Error in submit_answer:', err);
        socket.emit('answer_ack', { success: false, error: 'Failed to record answer.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      if (socket.data.gameId && socket.data.isParticipant) {
        // Send host updated connected list
        sendHostFullState(io, null, socket.data.gameId);
      }
    });
  });
}

// Helper: Sanitize question for participant (strip correctOptionId!)
function sanitizeQuestionForParticipant(q) {
  if (!q) return null;
  const copy = { ...q };
  delete copy.correctOptionId;
  return copy;
}

// Helper: Get question with options
async function getQuestionWithOpts(gameId, orderIndex) {
  const q = await dbGet('SELECT * FROM questions WHERE gameId = ? AND orderIndex = ?', [gameId, orderIndex]);
  if (!q) return null;
  const options = await dbAll('SELECT * FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [q.id]);
  return { ...q, options };
}

// Helper: Get leaderboard (Sorted by score DESC, totalTimeMs ASC)
async function getLeaderboard(gameId) {
  return await dbAll(
    'SELECT id, name, score, correctAnswers, wrongAnswers, totalTimeMs FROM participants WHERE gameId = ? ORDER BY score DESC, totalTimeMs ASC',
    [gameId]
  );
}

// Helper: Get question statistics
async function getQuestionStats(gameId, questionId) {
  if (!questionId) return null;

  const totalParticipantsRow = await dbGet('SELECT COUNT(*) as count FROM participants WHERE gameId = ?', [gameId]);
  const answers = await dbAll('SELECT optionId, isCorrect FROM answers WHERE questionId = ?', [questionId]);
  const options = await dbAll('SELECT id, orderIndex, text FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [questionId]);

  const optionDistribution = {};
  options.forEach(opt => {
    optionDistribution[opt.id] = 0;
  });

  let correctCount = 0;
  let wrongCount = 0;

  answers.forEach(ans => {
    if (optionDistribution[ans.optionId] !== undefined) {
      optionDistribution[ans.optionId]++;
    }
    if (ans.isCorrect) correctCount++;
    else wrongCount++;
  });

  return {
    totalParticipants: totalParticipantsRow ? totalParticipantsRow.count : 0,
    answeredCount: answers.length,
    notAnsweredCount: Math.max(0, (totalParticipantsRow ? totalParticipantsRow.count : 0) - answers.length),
    correctCount,
    wrongCount,
    optionDistribution
  };
}

// Helper: Send full state to host socket (or all host sockets in room)
async function sendHostFullState(io, targetSocket, gameId, activeQuestionId = null) {
  try {
    const game = await dbGet('SELECT * FROM games WHERE id = ?', [gameId]);
    if (!game) return;

    const questions = await dbAll('SELECT * FROM questions WHERE gameId = ? ORDER BY orderIndex ASC', [gameId]);
    for (let q of questions) {
      q.options = await dbAll('SELECT * FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [q.id]);
    }

    const currentQuestion = questions[game.currentQuestionIndex] || null;
    const targetQId = activeQuestionId || (currentQuestion ? currentQuestion.id : null);

    const participants = await dbAll('SELECT * FROM participants WHERE gameId = ? ORDER BY joinedAt DESC', [gameId]);
    const leaderboard = await getLeaderboard(gameId);
    const stats = await getQuestionStats(gameId, targetQId);

    const payload = {
      game,
      questions,
      currentQuestion,
      participants,
      leaderboard,
      stats
    };
    if (targetSocket) {
      targetSocket.emit('host_state_update', payload);
    } else {
      io.to(`host_${gameId}`).emit('host_state_update', payload);
    }
  } catch (err) {
    console.error('Error sending host state update:', err);
  }
}

// Helper: Broadcast current participant list to waiting participants
async function broadcastLobbyParticipants(io, gameId) {
  try {
    const list = await dbAll('SELECT id, name, avatarJson, joinedAt FROM participants WHERE gameId = ? ORDER BY joinedAt DESC', [gameId]);
    const parsedList = list.map(p => {
      let avatar = null;
      if (p.avatarJson) {
        try { avatar = JSON.parse(p.avatarJson); } catch (e) {}
      }
      return { id: p.id, name: p.name, avatar, joinedAt: p.joinedAt };
    });
    io.to(`participant_${gameId}`).emit('lobby_participants_updated', { participants: parsedList });
  } catch (err) {
    console.error('Error broadcasting lobby participants:', err);
  }
}

module.exports = { setupSocketHandlers };
