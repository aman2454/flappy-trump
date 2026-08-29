(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const FIRE_COOLDOWN = 26;

  let player, enemies, bullets, enemyBullets, score, frame, playing, dead, formDir;

  function reset() {
    player = { x: W / 2, y: H - 50, w: 24, cooldown: 0 };
    enemies = [];
    bullets = [];
    enemyBullets = [];
    score = 0;
    frame = 0;
    playing = false;
    dead = false;
    formDir = 1;
    spawnFormation();
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function spawnFormation() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        enemies.push({
          x: 24 + c * 44,
          y: 50 + r * 34,
          homeX: 24 + c * 44,
          homeY: 50 + r * 34,
          w: 28, h: 22,
          state: 'formation',
          cooldown: 60 + Math.random() * 120,
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

  function startDive(enemy) {
    enemy.state = 'diving';
    const dx = player.x - (enemy.x + enemy.w / 2);
    const dy = player.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    enemy.vx = (dx / len) * 3.5;
    enemy.vy = (dy / len) * 3.5 + 1.5;
  }

  function update() {
    if (!playing || dead) return;
    frame++;

    if (player.cooldown > 0) player.cooldown--;
    else if (playing) {
      bullets.push({ x: player.x, y: player.y - 12, vy: -9 });
      player.cooldown = FIRE_COOLDOWN;
    }

    bullets.forEach(b => { b.y += b.vy; });
    bullets = bullets.filter(b => b.y > -10);

    enemyBullets.forEach(b => { b.y += b.vy; });
    enemyBullets = enemyBullets.filter(b => b.y < H + 10 && b.y > -10);

    const formation = enemies.filter(e => e.alive && e.state === 'formation');
    if (formation.length) {
      let hitEdge = false;
      formation.forEach(e => {
        e.x += formDir * 0.8;
        if (e.x < 8 || e.x + e.w > W - 8) hitEdge = true;
      });
      if (hitEdge) formDir *= -1;

      if (frame % 90 === 0 && Math.random() < 0.4) {
        const shooters = formation.filter(e => e.y > 80);
        if (shooters.length) {
          const s = shooters[Math.floor(Math.random() * shooters.length)];
          enemyBullets.push({ x: s.x + s.w / 2, y: s.y + s.h, vy: 4.5 });
        }
      }

      if (frame % 180 === 0 && Math.random() < 0.55) {
        const divers = formation.filter(e => e.y > 60);
        if (divers.length) startDive(divers[Math.floor(Math.random() * divers.length)]);
      }
    }

    enemies.forEach(e => {
      if (!e.alive) return;
      if (e.state === 'diving') {
        e.x += e.vx;
        e.y += e.vy;
        if (frame % 45 === 0) enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, vy: 5 });
        if (e.y > H + 40) {
          e.state = 'formation';
          e.x = e.homeX;
          e.y = e.homeY;
        }
      } else {
        e.cooldown--;
        if (e.cooldown <= 0 && Math.random() < 0.008) {
          startDive(e);
          e.cooldown = 200;
        }
      }
    });

    enemies.forEach(e => {
      bullets.forEach(b => {
        if (!e.alive) return;
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
          e.alive = false;
          b.y = -999;
          score += e.state === 'diving' ? 200 : 100;
          scoreDisplay.textContent = score;
        }
      });
    });
    enemies = enemies.filter(e => e.alive);

    enemyBullets.forEach(b => {
      if (b.x > player.x - 12 && b.x < player.x + 12 && b.y > player.y - 14 && b.y < player.y + 8) {
        dead = true;
        playing = false;
      }
    });

    enemies.forEach(e => {
      if (e.y + e.h >= player.y - 6 && Math.abs(e.x + e.w / 2 - player.x) < 18) {
        dead = true;
        playing = false;
      }
    });

    if (enemies.length === 0) spawnFormation();
  }

  function drawEnemy(e) {
    ctx.fillStyle = e.state === 'diving' ? '#ff6b6b' : '#ffd700';
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2, e.y);
    ctx.lineTo(e.x, e.y + e.h);
    ctx.lineTo(e.x + e.w, e.y + e.h);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x + e.w / 2 - 3, e.y + 6, 6, 4);
  }

  function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 97 + frame) % W, (i * 53) % H, 1, 1);
    }

    enemies.forEach(drawEnemy);

    ctx.fillStyle = '#4d96ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 14);
    ctx.lineTo(player.x - 12, player.y + 8);
    ctx.lineTo(player.x + 12, player.y + 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    bullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));

    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
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
