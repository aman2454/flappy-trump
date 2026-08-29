(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');
  const container = document.getElementById('game-container');

  const GRID_COLS = 10;
  const GRID_ROWS = 20;

  let W, H, CELL, COLS, ROWS;

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
  };
  const COLORS = { I:'#00f0f0', O:'#f0f000', T:'#a000f0', S:'#00f000', Z:'#f00000', J:'#0000f0', L:'#f0a000' };

  let board, piece, score, lines, dropTimer, playing, dead, touchStart;

  function layoutGame() {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw < 1 || ch < 1) return;

    COLS = GRID_COLS;
    ROWS = GRID_ROWS;
    CELL = Math.max(8, Math.floor(Math.min(cw / COLS, ch / ROWS)));
    W = COLS * CELL;
    H = ROWS * CELL;
    canvas.width = W;
    canvas.height = H;
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomPiece() {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    return { type, matrix: SHAPES[type].map(r => r.slice()), x: 3, y: 0 };
  }

  function reset() {
    layoutGame();
    board = emptyBoard();
    piece = randomPiece();
    score = 0;
    lines = 0;
    dropTimer = 0;
    playing = false;
    dead = false;
    scoreDisplay.textContent = '0';
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function rotate(m) {
    const n = m.length;
    const r = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[x][n - 1 - y] = m[y][x];
    return r;
  }

  function collides(p, ox, oy, mat) {
    const m = mat || p.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue;
        const nx = p.x + x + ox, ny = p.y + y + oy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge() {
    piece.matrix.forEach((row, y) => {
      row.forEach((v, x) => {
        if (v && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.type;
      });
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(c => c)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] || 800;
      scoreDisplay.textContent = score;
    }
  }

  function spawn() {
    piece = randomPiece();
    if (collides(piece, 0, 0)) {
      dead = true;
      playing = false;
    }
  }

  function hardDrop() {
    while (!collides(piece, 0, 1)) piece.y++;
    lock();
  }

  function lock() {
    merge();
    clearLines();
    spawn();
  }

  function tryRotate() {
    const r = rotate(piece.matrix);
    if (!collides(piece, 0, 0, r)) piece.matrix = r;
    else if (!collides(piece, -1, 0, r)) { piece.x--; piece.matrix = r; }
    else if (!collides(piece, 1, 0, r)) { piece.x++; piece.matrix = r; }
  }

  function move(dx) {
    if (!collides(piece, dx, 0)) piece.x += dx;
  }

  function softDrop() {
    if (!collides(piece, 0, 1)) { piece.y++; score++; scoreDisplay.textContent = score; }
    else lock();
  }

  function start() {
    if (dead) reset();
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
    }
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    start();
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStart || !playing) { touchStart = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) { tryRotate(); return; }
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
    else if (dy > 0) softDrop();
    else tryRotate();
  }, { passive: false });

  canvas.addEventListener('click', () => {
    if (dead) { reset(); start(); return; }
    start();
    if (playing) tryRotate();
  });

  document.addEventListener('keydown', e => {
    start();
    if (!playing) return;
    if (e.code === 'ArrowLeft') move(-1);
    if (e.code === 'ArrowRight') move(1);
    if (e.code === 'ArrowDown') softDrop();
    if (e.code === 'ArrowUp') tryRotate();
    if (e.code === 'Space') hardDrop();
  });

  function onViewportChange() {
    if (playing && !dead) return;
    layoutGame();
  }

  window.addEventListener('resize', onViewportChange);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onViewportChange);
  }

  function update() {
    if (!playing || dead) return;
    dropTimer++;
    const speed = Math.max(8, 28 - Math.floor(lines / 5) * 2);
    if (dropTimer >= speed) {
      dropTimer = 0;
      if (!collides(piece, 0, 1)) piece.y++;
      else lock();
    }
  }

  function drawCell(x, y, type) {
    ctx.fillStyle = COLORS[type] || '#888';
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  function draw() {
    ctx.fillStyle = '#111820';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a3545';
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    board.forEach((row, y) => row.forEach((c, x) => { if (c) drawCell(x, y, c); }));

    piece.matrix.forEach((row, y) => {
      row.forEach((v, x) => {
        if (v && piece.y + y >= 0) drawCell(piece.x + x, piece.y + y, piece.type);
      });
    });

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Lines: ' + lines, 8, 18);

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Tap to restart', W / 2, H / 2 + 28);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
