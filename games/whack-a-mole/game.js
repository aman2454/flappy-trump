(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const COLS = 3, ROWS = 4;
  const PAD = 24;
  const CELL_W = (W - PAD * 2) / COLS;
  const CELL_H = (H - PAD * 2 - 40) / ROWS;
  const OX = PAD, OY = PAD + 30;

  let holes, score, timeLeft, playing, over, frame, best;

  function reset() {
    holes = Array.from({ length: COLS * ROWS }, (_, i) => ({
      x: i % COLS,
      y: Math.floor(i / COLS),
      up: false,
      progress: 0,
      timer: 0,
    }));
    score = 0;
    timeLeft = 30;
    playing = false;
    over = false;
    frame = 0;
    best = parseInt(localStorage.getItem('whackBest') || '0', 10);
    scoreDisplay.textContent = '0';
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function start() {
    if (over) { reset(); return; }
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
    }
  }

  function holeAt(x, y) {
    for (const h of holes) {
      const px = OX + h.x * CELL_W + CELL_W / 2;
      const py = OY + h.y * CELL_H + CELL_H / 2;
      if (Math.hypot(x - px, y - py) < CELL_W * 0.35) return h;
    }
    return null;
  }

  function tap(clientX, clientY) {
    start();
    if (!playing || over) return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    const y = (clientY - rect.top) * (H / rect.height);
    const h = holeAt(x, y);
    if (h && h.up) {
      h.up = false;
      h.progress = 0;
      score += 10;
      scoreDisplay.textContent = score;
    }
  }

  canvas.addEventListener('touchstart', e => { e.preventDefault(); tap(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('click', e => tap(e.clientX, e.clientY));

  function update() {
    if (!playing || over) return;
    frame++;
    if (frame % 60 === 0) {
      timeLeft--;
      if (timeLeft <= 0) {
        over = true;
        playing = false;
        if (score > best) { best = score; localStorage.setItem('whackBest', String(best)); }
      }
    }

    if (frame % 45 === 0) {
      const free = holes.filter(h => !h.up);
      if (free.length) {
        const h = free[Math.floor(Math.random() * free.length)];
        h.up = true;
        h.progress = 0;
        h.timer = 80 + Math.floor(Math.random() * 40);
      }
    }

    holes.forEach(h => {
      if (!h.up) return;
      h.progress = Math.min(1, h.progress + 0.04);
      h.timer--;
      if (h.timer <= 0) { h.up = false; h.progress = 0; }
    });
  }

  function draw() {
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time: ' + timeLeft + 's', W / 2, 24);

    holes.forEach(h => {
      const px = OX + h.x * CELL_W;
      const py = OY + h.y * CELL_H;
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.ellipse(px + CELL_W / 2, py + CELL_H * 0.7, CELL_W * 0.38, CELL_H * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      if (h.up) {
        const pop = h.progress;
        const my = py + CELL_H * 0.55 - pop * CELL_H * 0.35;
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(px + CELL_W / 2, my + 20, CELL_W * 0.28, CELL_H * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.arc(px + CELL_W / 2, my, CELL_W * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(px + CELL_W / 2 - 8, my - 4, 3, 0, Math.PI * 2);
        ctx.arc(px + CELL_W / 2 + 8, my - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffb6c1';
        ctx.beginPath();
        ctx.ellipse(px + CELL_W / 2, my + 6, 8, 5, 0, 0, Math.PI);
        ctx.fill();
      }
    });

    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText("TIME'S UP!", W / 2, H / 2 - 10);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + '  Best: ' + best, W / 2, H / 2 + 16);
      ctx.fillText('Tap to play again', W / 2, H / 2 + 40);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
