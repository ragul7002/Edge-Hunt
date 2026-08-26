const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { initDb, dbGet, dbAll, dbRun } = require('./database');
const { seedDefaultGame } = require('./seed');
const { setupSocketHandlers } = require('./socketHandler');
const { getLocalIpAddress } = require('./utils/ip');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// CORS setup
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketHandlers(io);

// Utility helper to generate unique Game Code (e.g. EDGE-7K92)
function generateGameCode(prefix = 'EDGE') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

// Helper: Generate UUID/ID
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// --- REST API ENDPOINTS ---

// Health & IP route
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.get('/api/ip', (req, res) => {
  const ip = getLocalIpAddress();
  res.json({
    ip,
    port: PORT,
    apiPort: PORT,
    joinUrl: `http://${ip}:${PORT}/join`
  });
});

// Upload image API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// Get all games
app.get('/api/games', async (req, res) => {
  try {
    const games = await dbAll('SELECT * FROM games ORDER BY createdAt DESC');
    for (let game of games) {
      const qCnt = await dbGet('SELECT COUNT(*) as count FROM questions WHERE gameId = ?', [game.id]);
      const pCnt = await dbGet('SELECT COUNT(*) as count FROM participants WHERE gameId = ?', [game.id]);
      game.questionsCount = qCnt ? qCnt.count : 0;
      game.participantsCount = pCnt ? pCnt.count : 0;
    }
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single game with questions & options
app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await dbGet('SELECT * FROM games WHERE id = ? OR gameCode = ?', [req.params.id, req.params.id]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const questions = await dbAll('SELECT * FROM questions WHERE gameId = ? ORDER BY orderIndex ASC', [game.id]);
    for (let q of questions) {
      q.options = await dbAll('SELECT * FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [q.id]);
    }

    res.json({ ...game, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new game
app.post('/api/games', async (req, res) => {
  try {
    const { name, description, autoAdvance, correctPoints, wrongPoints, speedBonus, showAnswer } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Game name is required' });
    }

    const id = generateId('game');
    const gameCode = generateGameCode('EDGE');
    const createdAt = new Date().toISOString();

    await dbRun(`
      INSERT INTO games (id, gameCode, name, description, status, currentQuestionIndex, autoAdvance, correctPoints, wrongPoints, speedBonus, showAnswer, createdAt)
      VALUES (?, ?, ?, ?, 'draft', 0, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      gameCode,
      name.trim(),
      description ? description.trim() : '',
      autoAdvance ? 1 : 0,
      correctPoints !== undefined ? correctPoints : 10,
      wrongPoints !== undefined ? wrongPoints : 0,
      speedBonus ? 1 : 0,
      showAnswer !== undefined ? (showAnswer ? 1 : 0) : 1,
      createdAt
    ]);

    const createdGame = await dbGet('SELECT * FROM games WHERE id = ?', [id]);
    res.status(201).json(createdGame);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update game
app.put('/api/games/:id', async (req, res) => {
  try {
    const { name, description, autoAdvance, correctPoints, wrongPoints, speedBonus, showAnswer, status } = req.body;
    const game = await dbGet('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await dbRun(`
      UPDATE games
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          autoAdvance = COALESCE(?, autoAdvance),
          correctPoints = COALESCE(?, correctPoints),
          wrongPoints = COALESCE(?, wrongPoints),
          speedBonus = COALESCE(?, speedBonus),
          showAnswer = COALESCE(?, showAnswer),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      description !== undefined ? description.trim() : null,
      autoAdvance !== undefined ? (autoAdvance ? 1 : 0) : null,
      correctPoints !== undefined ? correctPoints : null,
      wrongPoints !== undefined ? wrongPoints : null,
      speedBonus !== undefined ? (speedBonus ? 1 : 0) : null,
      showAnswer !== undefined ? (showAnswer ? 1 : 0) : null,
      status !== undefined ? status : null,
      req.params.id
    ]);

    const updated = await dbGet('SELECT * FROM games WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete game
app.delete('/api/games/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM games WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate game
app.post('/api/games/:id/duplicate', async (req, res) => {
  try {
    const origGame = await dbGet('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!origGame) return res.status(404).json({ error: 'Game not found' });

    const newGameId = generateId('game');
    const newCode = generateGameCode('EDGE');
    const createdAt = new Date().toISOString();

    await dbRun(`
      INSERT INTO games (id, gameCode, name, description, status, currentQuestionIndex, autoAdvance, correctPoints, wrongPoints, speedBonus, showAnswer, createdAt)
      VALUES (?, ?, ?, ?, 'draft', 0, ?, ?, ?, ?, ?, ?)
    `, [
      newGameId,
      newCode,
      `${origGame.name} (Copy)`,
      origGame.description,
      origGame.autoAdvance,
      origGame.correctPoints,
      origGame.wrongPoints,
      origGame.speedBonus,
      origGame.showAnswer,
      createdAt
    ]);

    // Copy questions & options
    const origQuestions = await dbAll('SELECT * FROM questions WHERE gameId = ? ORDER BY orderIndex ASC', [origGame.id]);
    for (let q of origQuestions) {
      const newQId = generateId('q');
      const origOpts = await dbAll('SELECT * FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [q.id]);

      let newCorrectOptId = null;
      const optIdMap = {};

      for (let opt of origOpts) {
        const newOptId = generateId('opt');
        optIdMap[opt.id] = newOptId;
        if (opt.id === q.correctOptionId) {
          newCorrectOptId = newOptId;
        }

        await dbRun(`
          INSERT INTO options (id, questionId, orderIndex, image, text)
          VALUES (?, ?, ?, ?, ?)
        `, [newOptId, newQId, opt.orderIndex, opt.image, opt.text]);
      }

      await dbRun(`
        INSERT INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [newQId, newGameId, q.orderIndex, q.text, q.image, q.points, q.timeLimit, newCorrectOptId]);
    }

    const dupGame = await dbGet('SELECT * FROM games WHERE id = ?', [newGameId]);
    res.status(201).json(dupGame);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Question to Game (Supports 2-6 Options dynamically)
app.post('/api/games/:id/questions', async (req, res) => {
  try {
    const { text, image, points, timeLimit, options, correctOptionIndex } = req.body;
    const game = await dbGet('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return res.status(400).json({ error: 'Questions must have between 2 and 6 options' });
    }

    const qCountRow = await dbGet('SELECT COUNT(*) as count FROM questions WHERE gameId = ?', [game.id]);
    const orderIndex = qCountRow ? qCountRow.count : 0;
    const qId = generateId('q');

    // Create Options first
    const createdOptionIds = [];
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const optId = generateId('opt');
      createdOptionIds.push(optId);

      await dbRun(`
        INSERT INTO options (id, questionId, orderIndex, image, text)
        VALUES (?, ?, ?, ?, ?)
      `, [optId, qId, i, opt.image || '', opt.text || '']);
    }

    const selectedCorrectIndex = (correctOptionIndex !== undefined && correctOptionIndex >= 0 && correctOptionIndex < createdOptionIds.length)
      ? correctOptionIndex
      : 0;
    const correctOptionId = createdOptionIds[selectedCorrectIndex];

    await dbRun(`
      INSERT INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      qId,
      game.id,
      orderIndex,
      text.trim(),
      image || '',
      points !== undefined ? Number(points) : (game.correctPoints || 10),
      timeLimit !== undefined ? Number(timeLimit) : 30,
      correctOptionId
    ]);

    const createdQ = await dbGet('SELECT * FROM questions WHERE id = ?', [qId]);
    createdQ.options = await dbAll('SELECT * FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [qId]);

    res.status(201).json(createdQ);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Question
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { text, image, points, timeLimit, options, correctOptionId, correctOptionIndex } = req.body;
    const question = await dbGet('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    if (options && Array.isArray(options)) {
      if (options.length < 2 || options.length > 6) {
        return res.status(400).json({ error: 'Questions must have between 2 and 6 options' });
      }

      // Delete existing options and recreate
      await dbRun('DELETE FROM options WHERE questionId = ?', [question.id]);

      const createdOptionIds = [];
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const optId = opt.id || generateId('opt');
        createdOptionIds.push(optId);

        await dbRun(`
          INSERT INTO options (id, questionId, orderIndex, image, text)
          VALUES (?, ?, ?, ?, ?)
        `, [optId, question.id, i, opt.image || '', opt.text || '']);
      }

      let finalCorrectOptId = correctOptionId;
      if (correctOptionIndex !== undefined && correctOptionIndex >= 0 && correctOptionIndex < createdOptionIds.length) {
        finalCorrectOptId = createdOptionIds[correctOptionIndex];
      } else if (!createdOptionIds.includes(finalCorrectOptId)) {
        finalCorrectOptId = createdOptionIds[0];
      }

      await dbRun(`
        UPDATE questions
        SET text = COALESCE(?, text),
            image = COALESCE(?, image),
            points = COALESCE(?, points),
            timeLimit = COALESCE(?, timeLimit),
            correctOptionId = ?
        WHERE id = ?
      `, [
        text ? text.trim() : null,
        image !== undefined ? image : null,
        points !== undefined ? Number(points) : null,
        timeLimit !== undefined ? Number(timeLimit) : null,
        finalCorrectOptId,
        question.id
      ]);
    } else {
      await dbRun(`
        UPDATE questions
        SET text = COALESCE(?, text),
            image = COALESCE(?, image),
            points = COALESCE(?, points),
            timeLimit = COALESCE(?, timeLimit),
            correctOptionId = COALESCE(?, correctOptionId)
        WHERE id = ?
      `, [
        text ? text.trim() : null,
        image !== undefined ? image : null,
        points !== undefined ? Number(points) : null,
        timeLimit !== undefined ? Number(timeLimit) : null,
        correctOptionId !== undefined ? correctOptionId : null,
        question.id
      ]);
    }

    const updatedQ = await dbGet('SELECT * FROM questions WHERE id = ?', [question.id]);
    updatedQ.options = await dbAll('SELECT * FROM options WHERE questionId = ? ORDER BY orderIndex ASC', [question.id]);

    res.json(updatedQ);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const q = await dbGet('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!q) return res.status(404).json({ error: 'Question not found' });

    await dbRun('DELETE FROM questions WHERE id = ?', [q.id]);

    // Re-index remaining questions
    const remaining = await dbAll('SELECT * FROM questions WHERE gameId = ? ORDER BY orderIndex ASC', [q.gameId]);
    for (let idx = 0; idx < remaining.length; idx++) {
      await dbRun('UPDATE questions SET orderIndex = ? WHERE id = ?', [idx, remaining[idx].id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder questions
app.post('/api/games/:id/reorder-questions', async (req, res) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ error: 'questionIds array required' });
    }

    for (let i = 0; i < questionIds.length; i++) {
      await dbRun('UPDATE questions SET orderIndex = ? WHERE id = ? AND gameId = ?', [i, questionIds[i], req.params.id]);
    }

    const updated = await dbAll('SELECT * FROM questions WHERE gameId = ? ORDER BY orderIndex ASC', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Game Results (JSON / CSV payload)
app.get('/api/games/:id/export', async (req, res) => {
  try {
    const game = await dbGet('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const participants = await dbAll(
      'SELECT id, name, score, correctAnswers, wrongAnswers, totalTimeMs, joinedAt FROM participants WHERE gameId = ? ORDER BY score DESC, totalTimeMs ASC',
      [game.id]
    );

    const questions = await dbAll('SELECT id, orderIndex, text, points FROM questions WHERE gameId = ? ORDER BY orderIndex ASC', [game.id]);
    const answers = await dbAll(
      'SELECT a.*, p.name as participantName FROM answers a JOIN participants p ON a.participantId = p.id WHERE p.gameId = ?',
      [game.id]
    );

    const format = req.query.format || 'json';

    if (format === 'csv') {
      let csv = 'Rank,Participant Name,Total Score,Correct Answers,Wrong Answers,Accuracy (%),Total Time (s)\n';
      participants.forEach((p, idx) => {
        const totalQ = p.correctAnswers + p.wrongAnswers;
        const accuracy = totalQ > 0 ? ((p.correctAnswers / totalQ) * 100).toFixed(1) : '0.0';
        const timeSec = (p.totalTimeMs / 1000).toFixed(1);
        csv += `${idx + 1},"${p.name.replace(/"/g, '""')}",${p.score},${p.correctAnswers},${p.wrongAnswers},${accuracy},${timeSec}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${game.name.replace(/[^a-z0-9]/gi, '_')}_results.csv"`);
      return res.send(csv);
    }

    res.json({
      game,
      exportDate: new Date().toISOString(),
      participants,
      questionsCount: questions.length,
      answers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend built assets in production
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Start Server
async function startServer() {
  try {
    await initDb();
    await seedDefaultGame();
    await dbRun("UPDATE games SET status = 'waiting' WHERE status = 'live'");

    server.listen(PORT, () => {
      const localIp = getLocalIpAddress();
      console.log(`\n==================================================`);
      console.log(`🚀 AI FRONTIERS GAME ZONE SERVER RUNNING`);
      console.log(`--------------------------------------------------`);
      console.log(`➜ Local Server:   http://localhost:${PORT}`);
      console.log(`➜ LAN Join URL:   http://${localIp}:${PORT}/join`);
      console.log(`==================================================\n`);
    });
  } catch (err) {
    console.error('Fatal Server Initialization Error:', err);
  }
}

startServer();
