const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// Promisified helpers
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function initDb() {
  db.serialize();

  // Create tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      gameCode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      currentQuestionIndex INTEGER DEFAULT 0,
      autoAdvance INTEGER DEFAULT 0,
      correctPoints INTEGER DEFAULT 10,
      wrongPoints INTEGER DEFAULT 0,
      speedBonus INTEGER DEFAULT 0,
      showAnswer INTEGER DEFAULT 1,
      questionStartTime INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      text TEXT NOT NULL,
      image TEXT,
      points INTEGER DEFAULT 10,
      timeLimit INTEGER DEFAULT 30,
      correctOptionId TEXT,
      FOREIGN KEY (gameId) REFERENCES games (id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      questionId TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      image TEXT,
      text TEXT,
      FOREIGN KEY (questionId) REFERENCES questions (id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      name TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      avatarJson TEXT,
      score INTEGER DEFAULT 0,
      correctAnswers INTEGER DEFAULT 0,
      wrongAnswers INTEGER DEFAULT 0,
      totalTimeMs INTEGER DEFAULT 0,
      joinedAt TEXT NOT NULL,
      FOREIGN KEY (gameId) REFERENCES games (id) ON DELETE CASCADE,
      UNIQUE (gameId, name)
    )
  `);

  // Safely add avatarJson column if table existed previously without it
  try {
    await dbRun('ALTER TABLE participants ADD COLUMN avatarJson TEXT');
  } catch (err) {
    // Column already exists
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      participantId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      optionId TEXT NOT NULL,
      isCorrect INTEGER NOT NULL,
      points INTEGER NOT NULL,
      responseTimeMs INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (participantId) REFERENCES participants (id) ON DELETE CASCADE,
      FOREIGN KEY (questionId) REFERENCES questions (id) ON DELETE CASCADE,
      UNIQUE (participantId, questionId)
    )
  `);

  console.log('Database tables initialized successfully.');
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDb
};
