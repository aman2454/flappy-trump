(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const GROUND = H - 80;

  let dino, obstacles, score, speed, playing, dead, touchStart, frame, best;

  function reset() {
    dino = { x: 50, y: GROUND, vy: 0, duck: false, h: 44, w: 36 };
    obstacles = [];
    score = 0;
    speed = 5;
    playing = false;
    dead = false;
    frame = 0;
    best = parseInt(localStorage.getItem('dinoBest') || '0', 10);
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

  function jump() {
    start();
    if (dino.y >= GROUND - 1) dino.vy = -13;
  }

  function duck(on) {
    start();
    dino.duck = on;
    dino.h = on ? 24 : 44;
    if (on && dino.y < GROUND) dino.vy = Math.max(dino.vy, 2);
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (dy > 30) duck(false);
    else if (dy < -30) jump();
    else jump();
  }, { passive: false });

  canvas.addEventListener('click', jump);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    if (e.code === 'ArrowDown') duck(true);
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') duck(false);
  });

  function spawnObstacle() {
    const tall = Math.random() < 0.35;
    obstacles.push({
      x: W + 20,
      w: tall ? 18 : 28,
      h: tall ? 52 : 28,
      y: tall ? GROUND - 52 + 28 : GROUND,
      tall,
    });
  }

  function update() {
    if (!playing || dead) return;
    frame++;
    score = Math.floor(frame / 6);
    scoreDisplay.textContent = score;
    speed = 5 + Math.floor(score / 100) * 0.5;

    dino.vy += 0.65;
    dino.y += dino.vy;
    if (dino.y > GROUND) { dino.y = GROUND; dino.vy = 0; }

    if (frame % Math.max(50, 90 - Math.floor(score / 50) * 5) === 0) spawnObstacle();

    obstacles.forEach(o => { o.x -= speed; });
    obstacles = obstacles.filter(o => o.x + o.w > -10);

    const dy = dino.duck ? GROUND + 20 - dino.h : dino.y;
    const dh = dino.h;
    for (const o of obstacles) {
      const ox = o.x, oy = o.tall ? o.y : o.y - o.h + 28;
      if (dino.x + dino.w > ox + 4 && dino.x + 4 < ox + o.w &&
          dy + dh > oy + 4 && dy + 4 < oy + o.h) {
        dead = true;
        playing = false;
        if (score > best) { best = score; localStorage.setItem('dinoBest', String(best)); }
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 28);
    ctx.lineTo(W, GROUND + 28);
    ctx.stroke();

    ctx.fillStyle = '#535353';
    const dy = dino.duck ? GROUND + 28 - dino.h : dino.y - dino.h + 28;
    ctx.fillRect(dino.x, dy, dino.w, dino.h);
    ctx.fillRect(dino.x + 24, dy - 8, 10, 10);

    obstacles.forEach(o => {
      ctx.fillStyle = '#535353';
      if (o.tall) ctx.fillRect(o.x, o.y, o.w, o.h);
      else ctx.fillRect(o.x, o.y - o.h + 28, o.w, o.h);
    });

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#535353';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + '  Best: ' + best, W / 2, H / 2 + 16);
      ctx.fillText('Tap to restart', W / 2, H / 2 + 40);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
