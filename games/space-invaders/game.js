(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const overlayTitle = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  let player, invaders, bullets, enemyBullets, score, frame, dir, gameOver, started;
  let touchStart = null;
  let touchMoved = false;

  function reset() {
    player = { x: W / 2, w: 28, h: 14, y: H - 40, cooldown: 0 };
    invaders = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        invaders.push({ x: 20 + c * 32, y: 40 + r * 28, w: 24, h: 18, alive: true });
      }
    }
    bullets = [];
    enemyBullets = [];
    score = 0;
    scoreDisplay.textContent = '0';
    frame = 0;
    dir = 1;
    gameOver = false;
    started = false;
  }

  function showMenu() {
    instructions.classList.remove('hidden');
    overlayTitle.classList.remove('hidden');
  }

  function hideMenu() {
    instructions.classList.add('hidden');
    overlayTitle.classList.add('hidden');
  }

  function start() {
    if (!started && !gameOver) {
      started = true;
      hideMenu();
    }
  }

  function tryRetry() {
    if (!gameOver) return false;
    reset();
    showMenu();
    return true;
  }

  function movePlayerFromClientX(clientX) {
    const rect = canvas.getBoundingClientRect();
    player.x = ((clientX - rect.left) / rect.width) * W;
    player.x = Math.max(14, Math.min(W - 14, player.x));
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) {
      tryRetry();
      return;
    }
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchMoved = false;
    movePlayerFromClientX(e.touches[0].clientX);
    start();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touchStart || gameOver || !started) return;
    touchMoved = true;
    movePlayerFromClientX(e.touches[0].clientX);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    if (!touchMoved && Math.abs(dx) < 28 && Math.abs(dy) < 28 && started && !gameOver) {
      fire();
    }
  }, { passive: false });

  canvas.addEventListener('mousemove', (e) => {
    if (!started || gameOver) return;
    movePlayerFromClientX(e.clientX);
  });

  canvas.addEventListener('click', (e) => {
    if (gameOver) {
      tryRetry();
      return;
    }
    if (!started) {
      start();
      return;
    }
    movePlayerFromClientX(e.clientX);
    fire();
  });

  document.addEventListener('keydown', (e) => {
    if (gameOver && (e.code === 'Space' || e.code === 'Enter')) {
      tryRetry();
      return;
    }
    if (!started) start();
    if (e.code === 'ArrowLeft') player.x -= 12;
    if (e.code === 'ArrowRight') player.x += 12;
    if (e.code === 'Space') { e.preventDefault(); fire(); }
    player.x = Math.max(14, Math.min(W - 14, player.x));
  });

  function fire() {
    if (!started || gameOver || player.cooldown > 0) return;
    bullets.push({ x: player.x, y: player.y - 4, vy: -6 });
    player.cooldown = 18;
  }

  function update() {
    if (!started || gameOver) return;
    frame++;
    if (player.cooldown > 0) player.cooldown--;

    if (frame % 30 === 0) {
      const alive = invaders.filter(i => i.alive);
      if (alive.length === 0) { gameOver = true; return; }
      let hitEdge = false;
      for (const inv of alive) {
        inv.x += dir * 4;
        if (inv.x < 8 || inv.x + inv.w > W - 8) hitEdge = true;
      }
      if (hitEdge) {
        dir *= -1;
        for (const inv of alive) inv.y += 12;
      }
      if (frame % 90 === 0 && alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        enemyBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, vy: 3 });
      }
    }

    bullets.forEach(b => { b.y += b.vy; });
    bullets = bullets.filter(b => b.y > 0);

    enemyBullets.forEach(b => { b.y += b.vy; });
    enemyBullets = enemyBullets.filter(b => b.y < H);

    for (const b of bullets) {
      for (const inv of invaders) {
        if (!inv.alive) continue;
        if (b.x > inv.x && b.x < inv.x + inv.w && b.y > inv.y && b.y < inv.y + inv.h) {
          inv.alive = false;
          b.y = -999;
          score += 10;
          scoreDisplay.textContent = score;
        }
      }
    }

    for (const b of enemyBullets) {
      if (b.x > player.x - player.w / 2 && b.x < player.x + player.w / 2 &&
          b.y > player.y && b.y < player.y + player.h) {
        gameOver = true;
      }
    }

    for (const inv of invaders) {
      if (inv.alive && inv.y + inv.h >= player.y) gameOver = true;
    }
  }

  function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#6bcb77';
    for (const inv of invaders) {
      if (!inv.alive) continue;
      ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
      ctx.fillStyle = '#000';
      ctx.fillRect(inv.x + 6, inv.y + 5, 4, 4);
      ctx.fillRect(inv.x + 14, inv.y + 5, 4, 4);
      ctx.fillStyle = '#6bcb77';
    }

    ctx.fillStyle = '#4d96ff';
    ctx.fillRect(player.x - player.w / 2, player.y, player.w, player.h);

    ctx.fillStyle = '#ffd93d';
    bullets.forEach(b => ctx.fillRect(b.x - 1, b.y, 3, 8));
    ctx.fillStyle = '#ff6b6b';
    enemyBullets.forEach(b => ctx.fillRect(b.x - 1, b.y, 3, 8));

    if (!started) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO START', W / 2, H / 2);
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      const won = invaders.every(i => !i.alive);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', W / 2, H / 2 - 10);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 20);
      ctx.fillText('Tap to retry', W / 2, H / 2 + 45);
    }
  }

  reset();
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
})();
