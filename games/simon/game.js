(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const COLS = 3, ROWS = 3;
  const PAD = 20;
  const GAP = 10;
  const GRID_W = W - PAD * 2;
  const GRID_H = H - PAD * 2 - 20;
  const CELL_W = (GRID_W - GAP * (COLS - 1)) / COLS;
  const CELL_H = (GRID_H - GAP * (ROWS - 1)) / ROWS;
  const OX = PAD, OY = PAD + 16;

  const COLORS = [
    '#e74c3c', '#27ae60', '#3498db',
    '#f1c40f', '#9b59b6', '#e67e22',
    '#1abc9c', '#ff6b6b', '#4d96ff',
  ];
  const LIT = [
    '#ff8a8a', '#6bff8a', '#74c0fc',
    '#ffe066', '#d4a5ff', '#ffb347',
    '#5dffe0', '#ff9999', '#8ec5ff',
  ];

  let sequence, step, playing, showing, litPad, over, best;

  function reset() {
    sequence = [];
    step = 0;
    playing = false;
    showing = false;
    litPad = -1;
    over = false;
    best = parseInt(localStorage.getItem('simonBest') || '0', 10);
    scoreDisplay.textContent = '0';
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function padCount() { return COLS * ROWS; }

  function startRound() {
    sequence.push(Math.floor(Math.random() * padCount()));
    step = 0;
    showSequence();
  }

  function showSequence() {
    showing = true;
    let i = 0;
    function flash() {
      if (i >= sequence.length) { showing = false; litPad = -1; return; }
      litPad = sequence[i];
      setTimeout(() => { litPad = -1; i++; setTimeout(flash, 180); }, 400);
    }
    flash();
  }

  function start() {
    if (over) { reset(); return; }
    if (!playing && !showing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
      startRound();
    }
  }

  function padAt(x, y) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const px = OX + col * (CELL_W + GAP);
        const py = OY + row * (CELL_H + GAP);
        if (x >= px && x <= px + CELL_W && y >= py && y <= py + CELL_H) {
          return row * COLS + col;
        }
      }
    }
    return -1;
  }

  function tapPad(id) {
    if (!playing || showing || over) return;
    litPad = id;
    setTimeout(() => { if (litPad === id) litPad = -1; }, 160);
    if (id !== sequence[step]) {
      over = true;
      playing = false;
      if (sequence.length - 1 > best) {
        best = sequence.length - 1;
        localStorage.setItem('simonBest', String(best));
      }
      return;
    }
    step++;
    if (step >= sequence.length) {
      scoreDisplay.textContent = sequence.length;
      setTimeout(startRound, 550);
    }
  }

  function handleTap(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    const y = (clientY - rect.top) * (H / rect.height);
    const id = padAt(x, y);
    if (id >= 0) tapPad(id);
    else start();
  }

  canvas.addEventListener('touchstart', e => { e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    handleTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: false });
  canvas.addEventListener('click', e => handleTap(e.clientX, e.clientY));

  function draw() {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, W, H);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const id = row * COLS + col;
        const px = OX + col * (CELL_W + GAP);
        const py = OY + row * (CELL_H + GAP);
        ctx.fillStyle = litPad === id ? LIT[id] : COLORS[id];
        ctx.beginPath();
        ctx.roundRect(px, py, CELL_W, CELL_H, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playing ? 'Level ' + sequence.length : 'Tap a pad to start', W / 2, 22);

    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + (sequence.length - 1) + '  Best: ' + best, W / 2, H / 2 + 18);
      ctx.fillText('Tap to restart', W / 2, H / 2 + 44);
    }
  }

  function loop() { draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
