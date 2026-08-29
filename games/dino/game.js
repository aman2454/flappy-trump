(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const GROUND = H - 72;

  let dino, obstacles, clouds, groundOffset, score, speed, playing, dead, touchStart, frame, best;

  function reset() {
    dino = { x: 54, y: GROUND, vy: 0, duck: false, h: 46, w: 40, leg: 0 };
    obstacles = [];
    clouds = [
      { x: 120, y: 70, w: 46 },
      { x: 260, y: 110, w: 36 },
      { x: 420, y: 55, w: 52 },
    ];
    groundOffset = 0;
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
    if (dino.y >= GROUND - 1) dino.vy = -13.5;
  }

  function duck(on) {
    start();
    dino.duck = on;
    dino.h = on ? 26 : 46;
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
    const tall = Math.random() < 0.38;
    if (tall) {
      obstacles.push({
        type: 'bird',
        x: W + 30,
        y: GROUND - 58 - Math.random() * 28,
        w: 38,
        h: 28,
        wing: 0,
      });
    } else {
      const variant = Math.floor(Math.random() * 3);
      obstacles.push({
        type: 'cactus',
        x: W + 30,
        w: variant === 2 ? 48 : 22,
        h: variant === 0 ? 48 : 34,
        y: GROUND,
        variant,
      });
    }
  }

  function update() {
    if (!playing || dead) return;
    frame++;
    if (frame % 6 === 0) dino.leg = (dino.leg + 1) % 2;
    score = Math.floor(frame / 6);
    scoreDisplay.textContent = score;
    speed = 5 + Math.floor(score / 100) * 0.5;
    groundOffset = (groundOffset + speed) % 24;

    dino.vy += 0.68;
    dino.y += dino.vy;
    if (dino.y > GROUND) { dino.y = GROUND; dino.vy = 0; }

    if (frame % Math.max(48, 88 - Math.floor(score / 50) * 4) === 0) spawnObstacle();

    obstacles.forEach(o => {
      o.x -= speed;
      if (o.type === 'bird') o.wing = (o.wing + 0.35) % (Math.PI * 2);
    });
    obstacles = obstacles.filter(o => o.x + o.w > -20);

    clouds.forEach(c => {
      c.x -= speed * 0.25;
      if (c.x + c.w < -20) { c.x = W + 40 + Math.random() * 80; c.y = 45 + Math.random() * 90; }
    });

    const dy = dino.duck ? GROUND + 24 - dino.h : dino.y - dino.h + 24;
    const dh = dino.h;
    for (const o of obstacles) {
      let ox, oy, ow, oh;
      if (o.type === 'bird') {
        ox = o.x; oy = o.y; ow = o.w; oh = o.h;
      } else {
        ox = o.x; oy = o.y - o.h + 24; ow = o.w; oh = o.h;
      }
      if (dino.x + dino.w > ox + 6 && dino.x + 8 < ox + ow - 4 &&
          dy + dh > oy + 6 && dy + 6 < oy + oh - 2) {
        dead = true;
        playing = false;
        if (score > best) { best = score; localStorage.setItem('dinoBest', String(best)); }
      }
    }
  }

  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND + 24);
    grad.addColorStop(0, '#eef6ff');
    grad.addColorStop(1, '#f7f7f7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCloud(c) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.w * 0.22, 0, Math.PI * 2);
    ctx.arc(c.x + c.w * 0.25, c.y - 6, c.w * 0.28, 0, Math.PI * 2);
    ctx.arc(c.x + c.w * 0.55, c.y, c.w * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround() {
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 24);
    ctx.lineTo(W, GROUND + 24);
    ctx.stroke();

    ctx.fillStyle = '#c8c8c8';
    for (let x = -groundOffset; x < W; x += 24) {
      ctx.fillRect(x + 8, GROUND + 32, 2, 2);
      ctx.fillRect(x + 18, GROUND + 40, 2, 2);
    }
  }

  function drawCactus(o) {
    const baseY = o.y + 24;
    ctx.fillStyle = '#3d7a45';
    const mainW = o.variant === 2 ? 16 : 12;
    const mainX = o.x + (o.w - mainW) / 2;
    ctx.fillRect(mainX, baseY - o.h, mainW, o.h);

    ctx.fillStyle = '#2f6236';
    if (o.variant !== 1) {
      ctx.fillRect(mainX + 2, baseY - o.h + 4, mainW - 4, o.h - 8);
    }
    if (o.variant === 0) {
      ctx.fillStyle = '#3d7a45';
      ctx.fillRect(mainX - 10, baseY - o.h + 18, 10, 8);
      ctx.fillRect(mainX - 10, baseY - o.h + 10, 8, 10);
      ctx.fillRect(mainX + mainW, baseY - o.h + 24, 10, 8);
      ctx.fillRect(mainX + mainW + 2, baseY - o.h + 16, 8, 10);
    } else if (o.variant === 2) {
      ctx.fillRect(mainX + mainW + 4, baseY - o.h + 20, 10, 8);
      ctx.fillRect(mainX + mainW + 6, baseY - o.h + 12, 8, 12);
      ctx.fillRect(mainX - 14, baseY - o.h + 28, 10, 8);
      ctx.fillRect(mainX - 16, baseY - o.h + 18, 8, 12);
    }
  }

  function drawBird(o) {
    ctx.fillStyle = '#5c5c5c';
    ctx.fillRect(o.x + 8, o.y + 10, 22, 8);
    ctx.fillRect(o.x + 28, o.y + 12, 8, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(o.x + 12, o.y + 12, 3, 3);
    const wingY = Math.sin(o.wing) * 6;
    ctx.fillStyle = '#666';
    ctx.fillRect(o.x + 14, o.y + 4 + wingY, 14, 4);
  }

  function drawDino() {
    const baseY = dino.duck ? GROUND + 24 : dino.y + 24;
    const topY = baseY - dino.h;
    const x = dino.x;

    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(x + dino.w / 2, GROUND + 24, dino.w * 0.45, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#444';
    if (dino.duck) {
      ctx.fillRect(x, topY + 8, dino.w, dino.h - 8);
      ctx.fillRect(x + 28, topY + 2, 14, 12);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 34, topY + 5, 4, 4);
      return;
    }

    ctx.fillRect(x + 8, topY + 18, 22, dino.h - 18);
    ctx.fillRect(x + 22, topY + 4, 18, 20);
    ctx.fillRect(x + 34, topY + 8, 8, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 28, topY + 8, 5, 5);
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 30, topY + 10, 2, 2);

    ctx.fillStyle = '#444';
    const legFront = dino.leg === 0;
    ctx.fillRect(x + 12, baseY - 8, 6, 8);
    ctx.fillRect(x + 24, baseY - (legFront ? 12 : 8), 6, legFront ? 12 : 8);
    ctx.fillRect(x + 4, topY + 24, 8, 4);
  }

  function draw() {
    drawSky();
    clouds.forEach(drawCloud);
    drawGround();

    obstacles.forEach(o => {
      if (o.type === 'bird') drawBird(o);
      else drawCactus(o);
    });

    drawDino();

    ctx.fillStyle = '#535353';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(String(score).padStart(5, '0'), W - 16, 36);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText('HI ' + String(best).padStart(5, '0'), W - 16, 52);

    if (dead) {
      ctx.fillStyle = 'rgba(238,238,238,0.75)';
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
