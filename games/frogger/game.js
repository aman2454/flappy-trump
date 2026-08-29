(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const LANES = 9;
  const LANE_H = Math.floor(H / (LANES + 1));
  const COLS = 9;
  const CELL = W / COLS;

  let frog, lanes, score, lives, playing, dead, touchStart;

  function makeLane(y, type, speed, count) {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push({
        x: (W / count) * i + Math.random() * 40,
        w: type === 'log' ? 70 : 48,
        speed: speed * (Math.random() > 0.5 ? 1 : -1),
      });
    }
    return { y, type, items };
  }

  function reset() {
    frog = { x: Math.floor(COLS / 2), y: LANES - 1 };
    lanes = [];
    for (let i = 1; i < LANES; i++) {
      const dir = i % 2 === 0 ? 1.2 : -1.4;
      const type = i % 3 === 0 ? 'log' : 'car';
      lanes.push(makeLane(i, type, dir + i * 0.08, 3 + (i % 2)));
    }
    score = 0;
    lives = 3;
    playing = false;
    dead = false;
    scoreDisplay.textContent = '0';
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function start() {
    if (dead) { reset(); return; }
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
    }
  }

  function hop(dx, dy) {
    if (!playing || dead) return;
    start();
    frog.x = Math.max(0, Math.min(COLS - 1, frog.x + dx));
    frog.y = Math.max(0, Math.min(LANES - 1, frog.y + dy));
    if (dy < 0) { score += 10; scoreDisplay.textContent = score; }
    if (frog.y === 0) {
      score += 100;
      scoreDisplay.textContent = score;
      frog.y = LANES - 1;
      frog.x = Math.floor(COLS / 2);
    }
    checkHit();
  }

  function checkHit() {
    if (frog.y === LANES - 1 || frog.y === 0) return;
    const lane = lanes.find(l => l.y === frog.y);
    if (!lane) return;
    const fx = frog.x * CELL + CELL / 2;
    let safe = lane.type === 'log';
    for (const item of lane.items) {
      if (fx >= item.x && fx <= item.x + item.w) {
        if (lane.type === 'log') safe = true;
        else safe = false;
      }
    }
    if (!safe) loseLife();
  }

  function loseLife() {
    lives--;
    if (lives <= 0) { dead = true; playing = false; }
    else { frog.x = Math.floor(COLS / 2); frog.y = LANES - 1; }
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
    lanes.forEach(lane => {
      lane.items.forEach(item => {
        item.x += item.speed;
        if (item.speed > 0 && item.x > W + 20) item.x = -item.w - 20;
        if (item.speed < 0 && item.x + item.w < -20) item.x = W + 20;
      });
    });
    if (frog.y > 0 && frog.y < LANES - 1) {
      const lane = lanes.find(l => l.y === frog.y);
      if (lane && lane.type === 'log') {
        const fx = frog.x * CELL + CELL / 2;
        for (const item of lane.items) {
          if (fx >= item.x && fx <= item.x + item.w) {
            frog.x += item.speed / CELL;
            if (frog.x < 0 || frog.x >= COLS) loseLife();
            break;
          }
        }
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#142814';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y <= LANES; y++) {
      const py = y * LANE_H;
      ctx.fillStyle = y === 0 ? '#2d6a4f' : y === LANES ? '#1b4332' : y % 2 ? '#1a331a' : '#152a15';
      ctx.fillRect(0, py, W, LANE_H);
    }

    lanes.forEach(lane => {
      lane.items.forEach(item => {
        ctx.fillStyle = lane.type === 'log' ? '#8b5a2b' : '#e63946';
        ctx.fillRect(item.x, lane.y * LANE_H + 6, item.w, LANE_H - 12);
        if (lane.type === 'car') {
          ctx.fillStyle = '#fff';
          ctx.fillRect(item.x + 6, lane.y * LANE_H + 10, 8, 6);
        }
      });
    });

    ctx.fillStyle = '#6bff8a';
    ctx.beginPath();
    ctx.arc(frog.x * CELL + CELL / 2, frog.y * LANE_H + LANE_H / 2, CELL * 0.35, 0, Math.PI * 2);
    ctx.fill();

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
      ctx.fillText('Swipe to restart', W / 2, H / 2 + 28);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
