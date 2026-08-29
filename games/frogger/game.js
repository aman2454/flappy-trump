(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const ROWS = 13;
  const COLS = 7;
  const ROW_H = H / ROWS;
  const COL_W = W / COLS;

  const ROW_GOAL = 0;
  const ROW_RIVER_START = 1;
  const ROW_RIVER_END = 5;
  const ROW_SAFE = 6;
  const ROW_ROAD_START = 7;
  const ROW_ROAD_END = 11;
  const ROW_START = 12;

  const GOALS = [1, 2, 3, 4, 5];

  let frog, cars, logs, score, lives, playing, dead, touchStart, frame;

  function reset() {
    frog = { col: 3, row: ROW_START, hopAnim: 0, fromCol: 3, fromRow: ROW_START };
    cars = buildCars();
    logs = buildLogs();
    score = 0;
    lives = 3;
    playing = false;
    dead = false;
    frame = 0;
    scoreDisplay.textContent = '0';
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function buildCars() {
    const list = [];
    for (let row = ROW_ROAD_START; row <= ROW_ROAD_END; row++) {
      const count = 2 + (row % 2);
      const speed = (row % 2 === 0 ? 2.2 : -2.6) + (row - ROW_ROAD_START) * 0.15;
      const spacing = W / count;
      for (let i = 0; i < count; i++) {
        list.push({
          row, x: i * spacing + (row % 2 ? 40 : 0),
          w: 52, h: ROW_H * 0.65, speed,
          color: ['#e63946', '#457b9d', '#f4a261', '#2a9d8f'][row % 4],
        });
      }
    }
    return list;
  }

  function buildLogs() {
    const list = [];
    for (let row = ROW_RIVER_START; row <= ROW_RIVER_END; row++) {
      const count = 2;
      const speed = (row % 2 === 0 ? 1.4 : -1.8);
      for (let i = 0; i < count; i++) {
        list.push({
          row, x: i * (W / count) + (row % 2 ? 30 : 0),
          w: 90, h: ROW_H * 0.55, speed,
        });
      }
    }
    return list;
  }

  function start() {
    if (dead) { reset(); return; }
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
    }
  }

  function frogCenterX() {
    if (frog.hopAnim > 0) {
      const t = 1 - frog.hopAnim / 8;
      const col = frog.fromCol + (frog.col - frog.fromCol) * t;
      return col * COL_W + COL_W / 2;
    }
    return frog.col * COL_W + COL_W / 2;
  }

  function frogCenterY() {
    if (frog.hopAnim > 0) {
      const t = 1 - frog.hopAnim / 8;
      const row = frog.fromRow + (frog.row - frog.fromRow) * t;
      return row * ROW_H + ROW_H / 2;
    }
    return frog.row * ROW_H + ROW_H / 2;
  }

  function hop(dx, dy) {
    if (!playing || dead || frog.hopAnim > 0) return;
    start();
    const nc = Math.max(0, Math.min(COLS - 1, frog.col + dx));
    const nr = Math.max(0, Math.min(ROWS - 1, frog.row + dy));
    if (nc === frog.col && nr === frog.row) return;

    frog.fromCol = frog.col;
    frog.fromRow = frog.row;
    frog.col = nc;
    frog.row = nr;
    frog.hopAnim = 8;

    if (dy < 0) { score += 10; scoreDisplay.textContent = score; }

    if (frog.row === ROW_GOAL) {
      if (GOALS.includes(frog.col)) {
        score += 50;
        scoreDisplay.textContent = score;
        frog.col = 3;
        frog.row = ROW_START;
        frog.fromCol = 3;
        frog.fromRow = ROW_START;
      } else {
        loseLife();
      }
    }
  }

  function loseLife() {
    lives--;
    frog.col = 3;
    frog.row = ROW_START;
    frog.fromCol = 3;
    frog.fromRow = ROW_START;
    frog.hopAnim = 0;
    if (lives <= 0) { dead = true; playing = false; }
  }

  function onRiver(row) {
    return row >= ROW_RIVER_START && row <= ROW_RIVER_END;
  }

  function onRoad(row) {
    return row >= ROW_ROAD_START && row <= ROW_ROAD_END;
  }

  function checkCollisions() {
    const fx = frogCenterX();
    const fy = frogCenterY();
    const fr = 14;

    if (onRoad(frog.row)) {
      for (const car of cars) {
        if (car.row !== frog.row) continue;
        if (fx + fr > car.x && fx - fr < car.x + car.w) loseLife();
      }
    }

    if (onRiver(frog.row)) {
      let onLog = false;
      for (const log of logs) {
        if (log.row !== frog.row) continue;
        if (fx + fr > log.x && fx - fr < log.x + log.w) {
          onLog = true;
          frog.col = Math.max(0, Math.min(COLS - 1, frog.col + log.speed / COL_W));
        }
      }
      if (!onLog && frog.hopAnim === 0) loseLife();
      if (frog.col < 0 || frog.col >= COLS) loseLife();
    }
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
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { start(); return; }
    if (Math.abs(dx) > Math.abs(dy)) hop(dx > 0 ? 1 : -1, 0);
    else hop(0, dy > 0 ? 1 : -1);
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') hop(0, -1);
    if (e.code === 'ArrowDown') hop(0, 1);
    if (e.code === 'ArrowLeft') hop(-1, 0);
    if (e.code === 'ArrowRight') hop(1, 0);
  });

  function update() {
    if (!playing || dead) return;
    frame++;
    if (frog.hopAnim > 0) frog.hopAnim--;

    [...cars, ...logs].forEach(obj => {
      obj.x += obj.speed;
      if (obj.speed > 0 && obj.x > W + 10) obj.x = -obj.w - 10;
      if (obj.speed < 0 && obj.x + obj.w < -10) obj.x = W + 10;
    });

    if (frog.hopAnim === 0 || onRiver(frog.row)) checkCollisions();
  }

  function drawRowBg(row) {
    if (row === ROW_GOAL) return '#2d6a4f';
    if (onRiver(row)) return row % 2 ? '#1d4e89' : '#163d6e';
    if (row === ROW_SAFE) return '#1b4332';
    if (onRoad(row)) return row % 2 ? '#333' : '#2a2a2a';
    return '#1b4332';
  }

  function drawFrog(x, y) {
    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(x - 6, y - 8, 5, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 6, y - 9, 2, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 9, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    for (let row = 0; row < ROWS; row++) {
      ctx.fillStyle = drawRowBg(row);
      ctx.fillRect(0, row * ROW_H, W, ROW_H);
    }

    GOALS.forEach(g => {
      ctx.fillStyle = '#40916c';
      ctx.beginPath();
      ctx.arc(g * COL_W + COL_W / 2, ROW_H / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#95d5b2';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    logs.forEach(log => {
      const y = log.row * ROW_H + ROW_H * 0.25;
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(log.x, y, log.w, log.h);
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(log.x + 4, y + 4, log.w - 8, log.h - 8);
    });

    cars.forEach(car => {
      const y = car.row * ROW_H + (ROW_H - car.h) / 2;
      ctx.fillStyle = car.color;
      ctx.fillRect(car.x, y, car.w, car.h);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(car.x + 6, y + 6, car.w - 12, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(car.x + 8, y + car.h - 8, 10, 5);
      ctx.fillRect(car.x + car.w - 18, y + car.h - 8, 10, 5);
    });

    drawFrog(frogCenterX(), frogCenterY());

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + lives, 8, 20);

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + ' · Swipe to restart', W / 2, H / 2 + 28);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
