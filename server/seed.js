const { dbRun, dbGet, initDb } = require('./database');

// Helper to create clean inline SVG Data URIs for realistic Edge Hunter images
function createSvgDataUri(bg, fg, style, text = '', label = '') {
  let innerElements = '';
  
  if (style === 'portrait_orig') {
    innerElements = `
      <rect width="100%" height="100%" fill="#0a0e17"/>
      <circle cx="200" cy="130" r="70" fill="none" stroke="#00f3ff" stroke-width="4"/>
      <ellipse cx="200" cy="130" rx="45" ry="55" fill="#161e2e" stroke="#8a2be2" stroke-width="3"/>
      <circle cx="180" cy="120" r="10" fill="#00f3ff"/>
      <circle cx="220" cy="120" r="10" fill="#00f3ff"/>
      <path d="M 180 155 Q 200 175 220 155" stroke="#00ff88" stroke-width="4" fill="none"/>
      <path d="M 130 200 L 270 200 L 240 270 L 160 270 Z" fill="#1e293b" stroke="#00f3ff" stroke-width="3"/>
      <line x1="200" y1="20" x2="200" y2="60" stroke="#00f3ff" stroke-width="2"/>
      <line x1="60" y1="130" x2="130" y2="130" stroke="#8a2be2" stroke-width="2"/>
      <line x1="270" y1="130" x2="340" y2="130" stroke="#8a2be2" stroke-width="2"/>
    `;
  } else if (style === 'portrait_canny') {
    // Sharp precise cyan edges on black
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <circle cx="200" cy="130" r="70" fill="none" stroke="#00f3ff" stroke-width="2" stroke-dasharray="6,2"/>
      <ellipse cx="200" cy="130" rx="45" ry="55" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="180" cy="120" r="10" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="220" cy="120" r="10" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <path d="M 180 155 Q 200 175 220 155" stroke="#00f3ff" stroke-width="2" fill="none"/>
      <path d="M 130 200 L 270 200 L 240 270 L 160 270 Z" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <line x1="200" y1="20" x2="200" y2="60" stroke="#00f3ff" stroke-width="2"/>
      <line x1="60" y1="130" x2="130" y2="130" stroke="#00f3ff" stroke-width="2"/>
      <line x1="270" y1="130" x2="340" y2="130" stroke="#00f3ff" stroke-width="2"/>
    `;
  } else if (style === 'portrait_sobel') {
    // Thick gradient edge
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <circle cx="200" cy="130" r="72" fill="none" stroke="#ff007f" stroke-width="6"/>
      <ellipse cx="200" cy="130" rx="47" ry="57" fill="none" stroke="#ff007f" stroke-width="5"/>
      <rect x="170" y="110" width="20" height="20" fill="none" stroke="#ff007f" stroke-width="4"/>
      <rect x="210" y="110" width="20" height="20" fill="none" stroke="#ff007f" stroke-width="4"/>
      <path d="M 175 155 L 225 155" stroke="#ff007f" stroke-width="5"/>
      <path d="M 125 195 L 275 195" stroke="#ff007f" stroke-width="6"/>
    `;
  } else if (style === 'portrait_laplacian') {
    // Dotted second derivative edge
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <circle cx="200" cy="130" r="70" fill="none" stroke="#00ff88" stroke-width="2" stroke-dasharray="2,5"/>
      <ellipse cx="200" cy="130" rx="45" ry="55" fill="none" stroke="#00ff88" stroke-width="2" stroke-dasharray="2,5"/>
      <circle cx="180" cy="120" r="10" fill="none" stroke="#00ff88" stroke-width="2" stroke-dasharray="2,4"/>
      <circle cx="220" cy="120" r="10" fill="none" stroke="#00ff88" stroke-width="2" stroke-dasharray="2,4"/>
      <path d="M 130 200 L 270 200 L 240 270 L 160 270 Z" fill="none" stroke="#00ff88" stroke-width="2" stroke-dasharray="3,3"/>
    `;
  } else if (style === 'portrait_blurred') {
    // Soft blurred outline
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <circle cx="200" cy="130" r="75" fill="none" stroke="#ffaa00" stroke-width="12" opacity="0.4"/>
      <ellipse cx="200" cy="130" rx="50" ry="60" fill="none" stroke="#ffaa00" stroke-width="10" opacity="0.4"/>
      <path d="M 120 190 L 280 190" stroke="#ffaa00" stroke-width="12" opacity="0.4"/>
    `;
  } else if (style === 'city_orig') {
    innerElements = `
      <rect width="100%" height="100%" fill="#0c0d1c"/>
      <rect x="40" y="80" width="60" height="200" fill="#1a1c38" stroke="#00f3ff" stroke-width="2"/>
      <rect x="120" y="40" width="80" height="240" fill="#25294a" stroke="#ff007f" stroke-width="2"/>
      <rect x="220" y="100" width="70" height="180" fill="#1a1c38" stroke="#8a2be2" stroke-width="2"/>
      <rect x="310" y="140" width="50" height="140" fill="#25294a" stroke="#00ff88" stroke-width="2"/>
      <!-- Windows -->
      <circle cx="160" cy="80" r="6" fill="#00f3ff"/>
      <circle cx="160" cy="120" r="6" fill="#00f3ff"/>
      <rect x="55" y="100" width="30" height="15" fill="#ff007f"/>
      <rect x="235" y="120" width="40" height="15" fill="#00ff88"/>
    `;
  } else if (style === 'city_canny') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <rect x="40" y="80" width="60" height="200" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <rect x="120" y="40" width="80" height="240" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <rect x="220" y="100" width="70" height="180" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <rect x="310" y="140" width="50" height="140" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="160" cy="80" r="6" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="160" cy="120" r="6" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <rect x="55" y="100" width="30" height="15" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <rect x="235" y="120" width="40" height="15" fill="none" stroke="#00f3ff" stroke-width="2"/>
    `;
  } else if (style === 'city_wrong1') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <line x1="0" y1="40" x2="400" y2="40" stroke="#ff0055" stroke-width="3"/>
      <line x1="0" y1="80" x2="400" y2="80" stroke="#ff0055" stroke-width="3"/>
      <line x1="0" y1="140" x2="400" y2="140" stroke="#ff0055" stroke-width="3"/>
    `;
  } else if (style === 'city_wrong2') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <rect x="20" y="20" width="360" height="240" fill="none" stroke="#ffaa00" stroke-width="4" stroke-dasharray="10,10"/>
    `;
  } else if (style === 'city_wrong3') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <circle cx="200" cy="140" r="100" fill="none" stroke="#8a2be2" stroke-width="4"/>
    `;
  } else if (style === 'neural_orig') {
    innerElements = `
      <rect width="100%" height="100%" fill="#080c14"/>
      <line x1="80" y1="80" x2="200" y2="140" stroke="#00f3ff" stroke-width="3"/>
      <line x1="80" y1="200" x2="200" y2="140" stroke="#00f3ff" stroke-width="3"/>
      <line x1="200" y1="140" x2="320" y2="80" stroke="#ff007f" stroke-width="3"/>
      <line x1="200" y1="140" x2="320" y2="200" stroke="#ff007f" stroke-width="3"/>
      <circle cx="80" cy="80" r="22" fill="#162032" stroke="#00f3ff" stroke-width="3"/>
      <circle cx="80" cy="200" r="22" fill="#162032" stroke="#00f3ff" stroke-width="3"/>
      <circle cx="200" cy="140" r="28" fill="#2d163a" stroke="#8a2be2" stroke-width="4"/>
      <circle cx="320" cy="80" r="22" fill="#321624" stroke="#ff007f" stroke-width="3"/>
      <circle cx="320" cy="200" r="22" fill="#321624" stroke="#ff007f" stroke-width="3"/>
    `;
  } else if (style === 'neural_canny') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <line x1="80" y1="80" x2="200" y2="140" stroke="#00f3ff" stroke-width="2"/>
      <line x1="80" y1="200" x2="200" y2="140" stroke="#00f3ff" stroke-width="2"/>
      <line x1="200" y1="140" x2="320" y2="80" stroke="#00f3ff" stroke-width="2"/>
      <line x1="200" y1="140" x2="320" y2="200" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="80" cy="80" r="22" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="80" cy="200" r="22" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="200" cy="140" r="28" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="320" cy="80" r="22" fill="none" stroke="#00f3ff" stroke-width="2"/>
      <circle cx="320" cy="200" r="22" fill="none" stroke="#00f3ff" stroke-width="2"/>
    `;
  } else if (style === 'neural_wrong1') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <rect x="60" y="60" width="280" height="160" fill="none" stroke="#ff0055" stroke-width="4"/>
    `;
  } else if (style === 'neural_wrong2') {
    innerElements = `
      <rect width="100%" height="100%" fill="#050508"/>
      <path d="M 50 140 Q 200 40 350 140 T 50 140" fill="none" stroke="#00ff88" stroke-width="3"/>
    `;
  } else {
    // Generic stylish edge card fallback
    innerElements = `
      <rect width="100%" height="100%" fill="${bg}"/>
      <polygon points="200,40 320,240 80,240" fill="none" stroke="${fg}" stroke-width="4" stroke-dasharray="${style.includes('dashed') ? '6,6' : 'none'}"/>
      <circle cx="200" cy="160" r="40" fill="none" stroke="${fg}" stroke-width="3"/>
    `;
  }

  const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="100%">
      ${innerElements}
      ${label ? `<text x="20" y="40" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">${label}</text>` : ''}
      ${text ? `<text x="200" y="260" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">${text}</text>` : ''}
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
}

async function seedDefaultGame() {
  await initDb();

  const existingGame = await dbGet("SELECT * FROM games WHERE gameCode = 'EDGE-7K92'");
  if (existingGame) {
    console.log('Sample Edge Hunter game already exists in database.');
    return;
  }

  console.log('Seeding default Edge Hunter sample game...');

  const gameId = 'game_edge_hunter_default';
  const gameCode = 'EDGE-7K92';
  const createdAt = new Date().toISOString();

  // Insert Game
  await dbRun(`
    INSERT OR IGNORE INTO games (id, gameCode, name, description, status, currentQuestionIndex, autoAdvance, correctPoints, wrongPoints, speedBonus, showAnswer, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    gameId,
    gameCode,
    'Edge Hunter 🎯',
    'AI Frontiers interactive computer vision game. Test your ability to match original AI images with their true edge detection filter boundaries!',
    'waiting',
    0,
    0,
    10,
    0,
    1,
    1,
    createdAt
  ]);

  // Question 1 (4 Options)
  const q1Id = 'q1_portrait';
  const q1Img = createSvgDataUri('#0a0e17', '#00f3ff', 'portrait_orig', '', 'AI Cyber Portrait');
  await dbRun(`
    INSERT OR IGNORE INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [q1Id, gameId, 0, 'Match the original AI Cyber Portrait with its exact Canny Edge Detection map.', q1Img, 10, 30, 'q1_opt1']);

  const q1Opts = [
    { id: 'q1_opt1', text: 'Canny Edge Filter (True Match)', style: 'portrait_canny', bg: '#000', fg: '#00f3ff' },
    { id: 'q1_opt2', text: 'Sobel Gradient Filter', style: 'portrait_sobel', bg: '#000', fg: '#ff007f' },
    { id: 'q1_opt3', text: 'Laplacian 2nd Derivative', style: 'portrait_laplacian', bg: '#000', fg: '#00ff88' },
    { id: 'q1_opt4', text: 'Gaussian Blur Contour', style: 'portrait_blurred', bg: '#000', fg: '#ffaa00' }
  ];

  for (let idx = 0; idx < q1Opts.length; idx++) {
    const opt = q1Opts[idx];
    const optImg = createSvgDataUri(opt.bg, opt.fg, opt.style, '', `Option ${idx + 1}`);
    await dbRun(`
      INSERT OR IGNORE INTO options (id, questionId, orderIndex, image, text)
      VALUES (?, ?, ?, ?, ?)
    `, [opt.id, q1Id, idx, optImg, opt.text]);
  }

  // Question 2 (4 Options)
  const q2Id = 'q2_landscape';
  const q2Img = createSvgDataUri('#050811', '#8a2be2', 'landscape_orig', '', 'AI Cyber City Horizon');
  await dbRun(`
    INSERT OR IGNORE INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [q2Id, gameId, 1, 'Identify the true edge boundary representation of the AI Cyber City Horizon.', q2Img, 10, 30, 'q2_opt2']);

  const q2Opts = [
    { id: 'q2_opt1', text: 'Horizontal Ridge Filter', style: 'city_wrong1', bg: '#000', fg: '#ff0055' },
    { id: 'q2_opt2', text: 'Canny Edge Filter (True Match)', style: 'city_canny', bg: '#000', fg: '#00f3ff' },
    { id: 'q2_opt3', text: 'Threshold Bounding Box', style: 'city_wrong2', bg: '#000', fg: '#ffaa00' },
    { id: 'q2_opt4', text: 'Radial Center Blur', style: 'city_wrong3', bg: '#000', fg: '#8a2be2' }
  ];

  for (let idx = 0; idx < q2Opts.length; idx++) {
    const opt = q2Opts[idx];
    const optImg = createSvgDataUri(opt.bg, opt.fg, opt.style, '', `Option ${idx + 1}`);
    await dbRun(`
      INSERT OR IGNORE INTO options (id, questionId, orderIndex, image, text)
      VALUES (?, ?, ?, ?, ?)
    `, [opt.id, q2Id, idx, optImg, opt.text]);
  }

  // Question 3 (3 Options)
  const q3Id = 'q3_neural';
  const q3Img = createSvgDataUri('#080c14', '#00f3ff', 'neural_orig', '', 'Neural Network Nodes');
  await dbRun(`
    INSERT OR IGNORE INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [q3Id, gameId, 2, 'Which high-frequency edge map corresponds to this Neural Network Architecture?', q3Img, 15, 20, 'q3_opt1']);

  const q3Opts = [
    { id: 'q3_opt1', text: 'Canny Edge Filter (True Match)', style: 'neural_canny', bg: '#000', fg: '#00f3ff' },
    { id: 'q3_opt2', text: 'Rectangular Bounding Filter', style: 'neural_wrong1', bg: '#000', fg: '#ff0055' },
    { id: 'q3_opt3', text: 'Spline Curve Approximation', style: 'neural_wrong2', bg: '#000', fg: '#00ff88' }
  ];

  for (let idx = 0; idx < q3Opts.length; idx++) {
    const opt = q3Opts[idx];
    const optImg = createSvgDataUri(opt.bg, opt.fg, opt.style, '', `Option ${idx + 1}`);
    await dbRun(`
      INSERT OR IGNORE INTO options (id, questionId, orderIndex, image, text)
      VALUES (?, ?, ?, ?, ?)
    `, [opt.id, q3Id, idx, optImg, opt.text]);
  }

  // Question 4 (5 Options)
  const q4Id = 'q4_robotics';
  const q4Img = createSvgDataUri('#050b14', '#8a2be2', 'generic_solid', '', 'Robotic Manipulator Arm');
  await dbRun(`
    INSERT OR IGNORE INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [q4Id, gameId, 3, 'Select the authentic edge feature map of the Cybernetic Robotic Arm.', q4Img, 20, 25, 'q4_opt3']);

  const q4Opts = [
    { id: 'q4_opt1', text: 'Noise Filter Map', style: 'generic_dashed', bg: '#000', fg: '#ff007f' },
    { id: 'q4_opt2', text: 'Low-Pass Silhouette', style: 'generic_solid', bg: '#000', fg: '#ffaa00' },
    { id: 'q4_opt3', text: 'Canny Edge Filter (True Match)', style: 'portrait_canny', bg: '#000', fg: '#00f3ff' },
    { id: 'q4_opt4', text: 'Dilation Boundary', style: 'generic_dashed', bg: '#000', fg: '#00ff88' },
    { id: 'q4_opt5', text: 'Erosion Skeleton', style: 'generic_solid', bg: '#000', fg: '#8a2be2' }
  ];

  for (let idx = 0; idx < q4Opts.length; idx++) {
    const opt = q4Opts[idx];
    const optImg = createSvgDataUri(opt.bg, opt.fg, opt.style, '', `Option ${idx + 1}`);
    await dbRun(`
      INSERT OR IGNORE INTO options (id, questionId, orderIndex, image, text)
      VALUES (?, ?, ?, ?, ?)
    `, [opt.id, q4Id, idx, optImg, opt.text]);
  }

  // Question 5 (6 Options)
  const q5Id = 'q5_quantum';
  const q5Img = createSvgDataUri('#0a0518', '#00ff88', 'generic_solid', '', 'Quantum Core Engine');
  await dbRun(`
    INSERT OR IGNORE INTO questions (id, gameId, orderIndex, text, image, points, timeLimit, correctOptionId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [q5Id, gameId, 4, 'Find the true edge boundary map of the Quantum Processing Core.', q5Img, 25, 30, 'q5_opt6']);

  const q5Opts = [
    { id: 'q5_opt1', text: 'Spectral Map A', style: 'generic_dashed', bg: '#000', fg: '#ff0055' },
    { id: 'q5_opt2', text: 'Spectral Map B', style: 'generic_solid', bg: '#000', fg: '#ffaa00' },
    { id: 'q5_opt3', text: 'Spectral Map C', style: 'generic_dashed', bg: '#000', fg: '#8a2be2' },
    { id: 'q5_opt4', text: 'Spectral Map D', style: 'generic_solid', bg: '#000', fg: '#ff007f' },
    { id: 'q5_opt5', text: 'Spectral Map E', style: 'generic_dashed', bg: '#000', fg: '#94a3b8' },
    { id: 'q5_opt6', text: 'Canny Edge Filter (True Match)', style: 'neural_canny', bg: '#000', fg: '#00f3ff' }
  ];

  for (let idx = 0; idx < q5Opts.length; idx++) {
    const opt = q5Opts[idx];
    const optImg = createSvgDataUri(opt.bg, opt.fg, opt.style, '', `Option ${idx + 1}`);
    await dbRun(`
      INSERT OR IGNORE INTO options (id, questionId, orderIndex, image, text)
      VALUES (?, ?, ?, ?, ?)
    `, [opt.id, q5Id, idx, optImg, opt.text]);
  }

  console.log('Sample Edge Hunter game seeded successfully with Game ID / Code: EDGE-7K92!');
}

if (require.main === module) {
  seedDefaultGame().then(() => process.exit(0)).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seedDefaultGame };
