(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');

  const W = canvas.width;
  const H = canvas.height;
  const CELL = 16;
  const COLS = Math.floor(W / CELL);
  const ROWS = Math.floor(H / CELL);

  const STATE = { READY: 0, PLAYING: 1, DEAD: 2 };
  let state = STATE.READY;
  let score = 0;
  let best = parseInt(localStorage.getItem('snakeBest') || '0', 10);
  let snake, dir, nextDir, food, tick;

  function reset() {
    snake = [{ x: 8, y: 15 }, { x: 7, y: 15 }, { x: 6, y: 15 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    spawnFood();
    score = 0;
    scoreDisplay.textContent = score;
    tick = 0;
  }

  function spawnFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function startPlaying() {
    state = STATE.PLAYING;
    instructions.classList.add('hidden');
    overlay.querySelector('h1').classList.add('hidden');
  }

  function tryRestart() {
    if (state === STATE.DEAD) {
      reset();
      startPlaying();
      return true;
    }
    if (state === STATE.READY) {
      startPlaying();
      return true;
    }
    return false;
  }

  function setDir(x, y) {
    if (state !== STATE.PLAYING) return;
    if (dir.x + x === 0 && dir.y + y === 0) return;
    nextDir = { x, y };
  }

  let touchStart = null;

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
      tryRestart();
      return;
    }
    if (state !== STATE.PLAYING) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
    else setDir(0, dy > 0 ? 1 : -1);
  }, { passive: false });

  canvas.addEventListener('click', () => tryRestart());

  document.addEventListener('keydown', (e) => {
    if (tryRestart()) return;
    if (e.code === 'ArrowUp') setDir(0, -1);
    if (e.code === 'ArrowDown') setDir(0, 1);
    if (e.code === 'ArrowLeft') setDir(-1, 0);
    if (e.code === 'ArrowRight') setDir(1, 0);
  });

  function update() {
    if (state !== STATE.PLAYING) return;
    tick++;
    if (tick % 6 !== 0) return;

    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { die(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { die(); return; }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreDisplay.textContent = score;
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function die() {
    state = STATE.DEAD;
    if (score > best) { best = score; localStorage.setItem('snakeBest', String(best)); }
  }

  function draw() {
    ctx.fillStyle = '#142218';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(food.x * CELL, food.y * CELL, CELL - 1, CELL - 1);

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#6bff8a' : '#27ae60';
      ctx.fillRect(s.x * CELL, s.y * CELL, CELL - 1, CELL - 1);
    });

    if (state === STATE.READY) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO START', W / 2, H / 2);
    }
    if (state === STATE.DEAD) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText('Score: ' + score + '  Best: ' + best, W / 2, H / 2 + 10);
      ctx.fillText('Tap to restart', W / 2, H / 2 + 40);
    }
  }

  reset();
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
})();
