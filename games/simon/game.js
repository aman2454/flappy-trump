(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const CX = W / 2, CY = H / 2 + 10;
  const R = Math.min(W, H) * 0.38;
  const GAP = 8;

  const PADS = [
    { id: 0, color: '#e74c3c', lit: '#ff6b6b', start: -Math.PI / 2, end: 0 },
    { id: 1, color: '#27ae60', lit: '#6bff8a', start: 0, end: Math.PI / 2 },
    { id: 2, color: '#f1c40f', lit: '#ffe066', start: Math.PI / 2, end: Math.PI },
    { id: 3, color: '#3498db', lit: '#74c0fc', start: Math.PI, end: Math.PI * 1.5 },
  ];

  let sequence, step, playing, showing, litPad, over, best, touchStart;

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

  function startRound() {
    sequence.push(Math.floor(Math.random() * 4));
    step = 0;
    showSequence();
  }

  function showSequence() {
    showing = true;
    let i = 0;
    function flash() {
      if (i >= sequence.length) { showing = false; litPad = -1; return; }
      litPad = sequence[i];
      setTimeout(() => { litPad = -1; i++; setTimeout(flash, 200); }, 450);
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
    const dx = x - CX, dy = y - CY;
    const dist = Math.hypot(dx, dy);
    if (dist < R * 0.28 || dist > R) return -1;
    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    for (const p of PADS) {
      let a = angle;
      if (p.id === 0 && a > Math.PI) a -= Math.PI * 2;
      if (a >= p.start && a < p.end) return p.id;
    }
    return -1;
  }

  function tapPad(id) {
    if (!playing || showing || over) return;
    litPad = id;
    setTimeout(() => { if (litPad === id) litPad = -1; }, 180);
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
      setTimeout(startRound, 600);
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

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleTap(t.clientX, t.clientY);
    touchStart = null;
  }, { passive: false });

  canvas.addEventListener('click', e => handleTap(e.clientX, e.clientY));

  function drawPad(p) {
    ctx.beginPath();
    ctx.arc(CX, CY, R, p.start + GAP / R, p.end - GAP / R);
    ctx.arc(CX, CY, R * 0.28, p.end - GAP / R, p.start + GAP / R, true);
    ctx.closePath();
    ctx.fillStyle = litPad === p.id ? p.lit : p.color;
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, W, H);

    PADS.forEach(drawPad);

    ctx.beginPath();
    ctx.arc(CX, CY, R * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playing ? 'Level ' + sequence.length : 'Tap center', CX, CY + 6);

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
