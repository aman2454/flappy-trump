(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');

  const W = canvas.width, H = canvas.height;
  let ship, bullets, asteroids, score, lives, started, gameOver;

  function wrap(v, max) {
    if (v < 0) return max + v;
    if (v > max) return v - max;
    return v;
  }

  function spawnAsteroids(n) {
    for (let i = 0; i < n; i++) {
      asteroids.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6 + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: 18 + Math.random() * 14,
        verts: 8,
      });
    }
  }

  function reset() {
    ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: -Math.PI / 2, cooldown: 0, inv: 0 };
    bullets = [];
    asteroids = [];
    score = 0;
    lives = 3;
    scoreDisplay.textContent = '0';
    started = false;
    gameOver = false;
    spawnAsteroids(4);
  }

  function start() {
    if (!started && !gameOver) {
      started = true;
      instructions.classList.add('hidden');
      document.querySelector('#overlay h1').classList.add('hidden');
    }
  }

  const input = { left: false, right: false, thrust: false };
  function bindBtn(id, key, val) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); input[key] = val; start(); if (key === 'fire') fire(); }, { passive: false });
    el.addEventListener('touchend', () => { if (key !== 'fire') input[key] = false; });
    el.addEventListener('mousedown', (e) => { e.preventDefault(); input[key] = val; start(); if (key === 'fire') fire(); });
    el.addEventListener('mouseup', () => { if (key !== 'fire') input[key] = false; });
  }
  bindBtn('btn-left', 'left', true);
  bindBtn('btn-right', 'right', true);
  bindBtn('btn-thrust', 'thrust', true);
  bindBtn('btn-fire', 'fire', true);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') input.left = true;
    if (e.code === 'ArrowRight') input.right = true;
    if (e.code === 'ArrowUp') input.thrust = true;
    if (e.code === 'Space') { e.preventDefault(); fire(); start(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') input.left = false;
    if (e.code === 'ArrowRight') input.right = false;
    if (e.code === 'ArrowUp') input.thrust = false;
  });

  function fire() {
    if (ship.cooldown > 0 || gameOver) return;
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * 12,
      y: ship.y + Math.sin(ship.angle) * 12,
      vx: ship.vx + Math.cos(ship.angle) * 5,
      vy: ship.vy + Math.sin(ship.angle) * 5,
      life: 50,
    });
    ship.cooldown = 12;
  }

  function hitShip() {
    if (ship.inv > 0) return;
    lives--;
    ship.inv = 90;
    ship.vx = 0; ship.vy = 0;
    if (lives <= 0) gameOver = true;
  }

  function update() {
    if (!started || gameOver) return;
    if (ship.cooldown > 0) ship.cooldown--;
    if (ship.inv > 0) ship.inv--;

    if (input.left) ship.angle -= 0.08;
    if (input.right) ship.angle += 0.08;
    if (input.thrust) {
      ship.vx += Math.cos(ship.angle) * 0.15;
      ship.vy += Math.sin(ship.angle) * 0.15;
    }
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x = wrap(ship.x + ship.vx, W);
    ship.y = wrap(ship.y + ship.vy, H);

    bullets.forEach(b => {
      b.x = wrap(b.x + b.vx, W);
      b.y = wrap(b.y + b.vy, H);
      b.life--;
    });
    bullets = bullets.filter(b => b.life > 0);

    asteroids.forEach(a => {
      a.x = wrap(a.x + a.vx, W);
      a.y = wrap(a.y + a.vy, H);
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const b = bullets[i], a = asteroids[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx * dx + dy * dy < a.r * a.r) {
          score += Math.floor(a.r);
          scoreDisplay.textContent = score;
          if (a.r > 14) {
            for (let k = 0; k < 2; k++) {
              asteroids.push({
                x: a.x, y: a.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                r: a.r * 0.55,
                verts: 7,
              });
            }
          }
          asteroids.splice(j, 1);
          bullets.splice(i, 1);
          break;
        }
      }
    }

    for (const a of asteroids) {
      const dx = ship.x - a.x, dy = ship.y - a.y;
      if (dx * dx + dy * dy < (a.r + 8) * (a.r + 8)) hitShip();
    }

    if (asteroids.length === 0) spawnAsteroids(4 + Math.floor(score / 100));
  }

  function drawAsteroid(a) {
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= a.verts; i++) {
      const ang = (i / a.verts) * Math.PI * 2;
      const r = a.r * (0.85 + (i % 3) * 0.08);
      const px = a.x + Math.cos(ang) * r;
      const py = a.y + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    asteroids.forEach(drawAsteroid);

    if (ship.inv % 10 < 5 || ship.inv === 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, 7);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.stroke();
      if (input.thrust) {
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-14, 4);
        ctx.lineTo(-14, -4);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.strokeStyle = '#ffd93d';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + lives, 8, 20);

    if (!started) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO START', W / 2, H / 2);
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2);
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 28);
      ctx.font = '13px Arial';
      ctx.fillText('Tap screen to retry', W / 2, H / 2 + 52);
    }
  }

  reset();
  canvas.addEventListener('click', () => { if (gameOver) reset(); });
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
})();
