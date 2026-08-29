(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;

  let player, enemies, bullets, score, frame, playing, dead, touchLast;

  function reset() {
    player = { x: W / 2, y: H - 50, w: 24, cooldown: 0 };
    enemies = [];
    bullets = [];
    score = 0;
    frame = 0;
    playing = false;
    dead = false;
    scoreDisplay.textContent = '0';
    spawnWave();
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function spawnWave() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        enemies.push({
          x: 30 + c * 44,
          y: -60 - r * 36,
          w: 28, h: 22,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 0.6 + r * 0.15,
          alive: true,
        });
      }
    }
  }

  function start() {
    if (dead) { reset(); return; }
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      title.classList.add('hidden');
    }
  }

  function movePlayer(clientX) {
    const rect = canvas.getBoundingClientRect();
    player.x = (clientX - rect.left) * (W / rect.width);
    player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
    start();
  }

  canvas.addEventListener('touchmove', e => { e.preventDefault(); movePlayer(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); movePlayer(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('mousemove', e => movePlayer(e.clientX));
  canvas.addEventListener('click', start);

  function update() {
    if (!playing || dead) return;
    frame++;

    if (player.cooldown > 0) player.cooldown--;
    else {
      bullets.push({ x: player.x, y: player.y - 10, vy: -8 });
      player.cooldown = 12;
    }

    bullets.forEach(b => { b.y += b.vy; });
    bullets = bullets.filter(b => b.y > -10);

    enemies.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < 10 || e.x > W - 30) e.vx *= -1;
      if (frame % 120 === 0 && Math.random() < 0.02) e.vy += 0.5;
    });

    enemies.forEach(e => {
      bullets.forEach(b => {
        if (!e.alive) return;
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
          e.alive = false;
          b.y = -999;
          score += 100;
          scoreDisplay.textContent = score;
        }
      });
    });
    enemies = enemies.filter(e => e.alive);

    enemies.forEach(e => {
      if (e.y + e.h >= player.y - 8 && Math.abs(e.x + e.w / 2 - player.x) < 20) {
        dead = true;
        playing = false;
      }
    });

    if (enemies.length === 0) spawnWave();
  }

  function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 97 + frame) % W, (i * 53) % H, 1, 1);
    }

    enemies.forEach(e => {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2, e.y);
      ctx.lineTo(e.x, e.y + e.h);
      ctx.lineTo(e.x + e.w, e.y + e.h);
      ctx.fill();
    });

    ctx.fillStyle = '#4d96ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 14);
    ctx.lineTo(player.x - 12, player.y + 8);
    ctx.lineTo(player.x + 12, player.y + 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
      ctx.fillRect(b.x - 2, b.y, 4, 10);
    });

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + ' · Tap to restart', W / 2, H / 2 + 28);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
