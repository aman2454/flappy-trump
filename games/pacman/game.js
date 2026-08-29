(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const MAZE_TEMPLATE = [
    '###################',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.### # ###.####',
    '   #.#       #.#   ',
    '####.# ##-## #.####',
    '    .  #   #  .    ',
    '####.# ##### #.####',
    '   #.#       #.#   ',
    '####.# ##### #.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#..#.......#......#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#.................#',
    '###################',
  ];

  const ROWS = MAZE_TEMPLATE.length;
  const COLS = Math.max(...MAZE_TEMPLATE.map(r => r.length));
  const W = canvas.width, H = canvas.height;
  const CELL = Math.floor(Math.min(W / COLS, (H - 40) / ROWS));
  const OX = (W - COLS * CELL) / 2;
  const OY = 36;

  const MOVE_INTERVAL = 14;
  const TUNNEL_ROWS = [7, 9, 11];

  let pac, dir, nextDir, ghosts, dots, score, lives, level, playing, dead, touchStart, tick, maze;
  let ghostInterval, levelFlash, frame;

  function isTunnelRow(y) {
    return TUNNEL_ROWS.includes(y);
  }

  function tunnelTarget(x, y, dx) {
    if (!isTunnelRow(y) || dx === 0) return x + dx;
    let nx = x + dx;
    if (nx >= 0 && nx < COLS && !isWall(nx, y)) return nx;
    if (dx < 0) {
      for (let i = COLS - 1; i >= 0; i--) if (!isWall(i, y)) return i;
    } else {
      for (let i = 0; i < COLS; i++) if (!isWall(i, y)) return i;
    }
    return nx;
  }

  function isWall(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
    return maze[y][x] === '#';
  }

  function isPellet(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    return maze[y][x] === '.';
  }

  function countPellets() {
    let n = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (maze[y][x] === '.') n++;
    return n;
  }

  function makeGhosts() {
    return [
      { x: 8, y: 9, fromX: 8, fromY: 9, color: '#ff0000', movedAt: 0 },
      { x: 9, y: 9, fromX: 9, fromY: 9, color: '#ffb8ff', movedAt: 0 },
      { x: 10, y: 9, fromX: 10, fromY: 9, color: '#00ffff', movedAt: 0 },
      { x: 11, y: 9, fromX: 11, fromY: 9, color: '#ffb852', movedAt: 0 },
    ];
  }

  function resetMaze() {
    maze = MAZE_TEMPLATE.map(row => row.padEnd(COLS, ' '));
  }

  function resetPositions() {
    pac = { x: 9, y: 15, fromX: 9, fromY: 15, mouth: 0, movedAt: 0 };
    dir = { x: 0, y: 0 };
    nextDir = { x: 0, y: 0 };
    ghosts = makeGhosts();
  }

  function reset() {
    resetMaze();
    resetPositions();
    dots = countPellets();
    score = 0;
    lives = 3;
    level = 1;
    ghostInterval = 12;
    levelFlash = 0;
    playing = false;
    dead = false;
    tick = 0;
    frame = 0;
    scoreDisplay.textContent = '0 · L1';
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function nextLevel() {
    level++;
    ghostInterval = Math.max(8, 12 - level);
    resetMaze();
    resetPositions();
    dots = countPellets();
    levelFlash = 90;
    playing = true;
    scoreDisplay.textContent = score + ' · L' + level;
  }

  function start() {
    if (dead) { reset(); return; }
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
    }
  }

  function setDir(x, y) {
    nextDir = { x, y };
    start();
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) { start(); return; }
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') setDir(0, -1);
    if (e.code === 'ArrowDown') setDir(0, 1);
    if (e.code === 'ArrowLeft') setDir(-1, 0);
    if (e.code === 'ArrowRight') setDir(1, 0);
  });

  function canMove(x, y, dx, dy) {
    const ny = y + dy;
    if (ny < 0 || ny >= ROWS) return false;
    if (dy !== 0) return !isWall(x, ny);
    const nx = tunnelTarget(x, y, dx);
    return nx >= 0 && nx < COLS && !isWall(nx, y);
  }

  function applyPosition(entity, nx, ny) {
    entity.fromX = entity.x;
    entity.fromY = entity.y;
    if (Math.abs(nx - entity.x) > COLS / 2) {
      entity.fromX = nx;
      entity.fromY = ny;
    }
    entity.x = nx;
    entity.y = ny;
    entity.movedAt = frame;
  }

  function moveGhost(g) {
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => canMove(g.x, g.y, dx, dy));
    if (!opts.length) return;

    const filtered = opts.filter(([dx, dy]) => !(g.lastDx === -dx && g.lastDy === -dy) || opts.length === 1);
    const choices = filtered.length ? filtered : opts;

    choices.sort((a, b) => {
      const da = Math.hypot(pac.x - tunnelTarget(g.x, g.y, a[0]), pac.y - (g.y + a[1]));
      const db = Math.hypot(pac.x - tunnelTarget(g.x, g.y, b[0]), pac.y - (g.y + b[1]));
      return da - db + (Math.random() - 0.5) * 0.4;
    });

    const dx = choices[0][0], dy = choices[0][1];
    const nx = dy === 0 ? tunnelTarget(g.x, g.y, dx) : g.x + dx;
    const ny = g.y + dy;
    applyPosition(g, nx, ny);
    g.lastDx = dx;
    g.lastDy = dy;
  }

  function lerpPos(from, to, movedAt, interval) {
    const t = Math.min(1, (frame - movedAt) / interval);
    return from + (to - from) * t;
  }

  function update() {
    frame++;

    if (!playing || dead) return;

    if (levelFlash > 0) {
      levelFlash--;
      return;
    }

    pac.mouth = (pac.mouth + 0.35) % 6;

    tick++;
    if (tick % MOVE_INTERVAL !== 0) return;

    if (canMove(pac.x, pac.y, nextDir.x, nextDir.y)) dir = nextDir;
    if (canMove(pac.x, pac.y, dir.x, dir.y)) {
      const nx = dir.y === 0 ? tunnelTarget(pac.x, pac.y, dir.x) : pac.x + dir.x;
      const ny = pac.y + dir.y;
      applyPosition(pac, nx, ny);
      if (isPellet(pac.x, pac.y)) {
        maze[pac.y] = maze[pac.y].slice(0, pac.x) + ' ' + maze[pac.y].slice(pac.x + 1);
        dots--;
        score += 10;
        scoreDisplay.textContent = score + ' · L' + level;
        if (dots <= 0) nextLevel();
      }
    }

    if (tick % ghostInterval === 0) ghosts.forEach(moveGhost);

    for (const g of ghosts) {
      if (g.x === pac.x && g.y === pac.y) {
        lives--;
        if (lives <= 0) { dead = true; playing = false; }
        else {
          pac = { x: 9, y: 15, fromX: 9, fromY: 15, mouth: 0, movedAt: frame };
          dir = { x: 0, y: 0 };
          nextDir = { x: 0, y: 0 };
          ghosts = makeGhosts();
        }
      }
    }
  }

  function drawPac(px, py, r) {
    const mouthOpen = pac.mouth < 3 ? 0.42 : 0.08;
    let angle = 0;
    if (dir.x === 1) angle = 0;
    else if (dir.x === -1) angle = Math.PI;
    else if (dir.y === 1) angle = Math.PI / 2;
    else if (dir.y === -1) angle = -Math.PI / 2;

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(px, py, r, angle + mouthOpen, angle - mouthOpen, false);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const eyeOffset = r * 0.35;
    const eyeX = px + Math.cos(angle) * eyeOffset * 0.5 - Math.sin(angle) * eyeOffset * 0.6;
    const eyeY = py + Math.sin(angle) * eyeOffset * 0.5 + Math.cos(angle) * eyeOffset * 0.6;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGhost(g, px, py, r) {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(px, py - r * 0.1, r, Math.PI, 0);
    ctx.lineTo(px + r, py + r * 0.85);
    for (let i = 2; i >= 0; i--) {
      ctx.lineTo(px + r * (i * 0.66 - 0.33), py + r * (i % 2 === 0 ? 0.55 : 0.85));
    }
    ctx.lineTo(px - r, py + r * 0.85);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px - r * 0.35, py - r * 0.05, r * 0.28, 0, Math.PI * 2);
    ctx.arc(px + r * 0.35, py - r * 0.05, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(px - r * 0.35, py - r * 0.05, r * 0.14, 0, Math.PI * 2);
    ctx.arc(px + r * 0.35, py - r * 0.05, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = (maze[y] || '')[x] || ' ';
        const px = OX + x * CELL;
        const py = OY + y * CELL;
        if (c === '#') {
          ctx.fillStyle = '#2121de';
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = '#4a4aff';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
        } else if (c === '.') {
          ctx.fillStyle = '#ffb897';
          ctx.beginPath();
          ctx.arc(px + CELL / 2, py + CELL / 2, Math.max(2, CELL * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const r = CELL * 0.4;
    const pacX = lerpPos(pac.fromX, pac.x, pac.movedAt, MOVE_INTERVAL);
    const pacY = lerpPos(pac.fromY, pac.y, pac.movedAt, MOVE_INTERVAL);
    drawPac(OX + pacX * CELL + CELL / 2, OY + pacY * CELL + CELL / 2, r);
    ghosts.forEach(g => {
      const gx = lerpPos(g.fromX, g.x, g.movedAt, ghostInterval);
      const gy = lerpPos(g.fromY, g.y, g.movedAt, ghostInterval);
      drawGhost(g, OX + gx * CELL + CELL / 2, OY + gy * CELL + CELL / 2, r * 0.95);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + lives, 8, 22);

    if (levelFlash > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL ' + level, W / 2, H / 2);
    }

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + ' · Level ' + level, W / 2, H / 2 + 16);
      ctx.fillText('Swipe to restart', W / 2, H / 2 + 40);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
