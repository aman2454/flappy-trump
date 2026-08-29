(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const overlayTitle = document.querySelector('#overlay h1');
  const fireBtn = document.getElementById('btn-fire');

  const W = canvas.width, H = canvas.height;
  const SAFE_DIST = 90;
  const STICK_RADIUS = 52;
  const STICK_DEAD = 10;
  const STICK_THRUST = 18;

  let ship, bullets, asteroids, score, lives, started, gameOver;
  let input, joystick, fireHeld;

  function wrap(v, max) {
    if (v < 0) return max + v;
    if (v > max) return v - max;
    return v;
  }

  function distToShip(x, y, r) {
    const dx = x - ship.x;
    const dy = y - ship.y;
    return Math.sqrt(dx * dx + dy * dy) - r;
  }

  function spawnAsteroid(x, y, r, vx, vy) {
    return { x, y, vx, vy, r, verts: r > 16 ? 8 : 7 };
  }

  function addAsteroidSafe(preferredX, preferredY, r, vx, vy) {
    let x = preferredX;
    let y = preferredY;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (preferredX == null) {
        x = Math.random() * W;
        y = Math.random() * H * 0.55 + 30;
      }
      if (distToShip(x, y, r) >= SAFE_DIST) {
        asteroids.push(spawnAsteroid(x, y, r, vx, vy));
        return;
      }
      x = Math.random() * W;
      y = Math.random() * H * 0.55 + 30;
    }
    const ang = Math.random() * Math.PI * 2;
    x = ship.x + Math.cos(ang) * (SAFE_DIST + r);
    y = ship.y + Math.sin(ang) * (SAFE_DIST + r);
    asteroids.push(spawnAsteroid(wrap(x, W), wrap(y, H), r, vx, vy));
  }

  function spawnAsteroids(n) {
    for (let i = 0; i < n; i++) {
      addAsteroidSafe(null, null, 18 + Math.random() * 14,
        (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
    }
  }

  function resetInput() {
    input = { left: false, right: false, thrust: false, thrustPower: 0 };
    joystick = {
      active: false,
      touchId: null,
      cx: 78,
      cy: H - 96,
      dx: 0,
      dy: 0,
    };
    fireHeld = false;
    fireBtn.classList.remove('pressed');
  }

  function reset() {
    ship = { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: -Math.PI / 2, cooldown: 0, inv: 120 };
    bullets = [];
    asteroids = [];
    score = 0;
    lives = 3;
    scoreDisplay.textContent = '0';
    started = false;
    gameOver = false;
    resetInput();
    spawnAsteroids(4);
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

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  }

  function updateJoystick(clientX, clientY) {
    const p = canvasPoint(clientX, clientY);
    let dx = p.x - joystick.cx;
    let dy = p.y - joystick.cy;
    const dist = Math.hypot(dx, dy);

    if (dist > STICK_RADIUS) {
      dx = (dx / dist) * STICK_RADIUS;
      dy = (dy / dist) * STICK_RADIUS;
    }

    joystick.dx = dx;
    joystick.dy = dy;

    if (dist > STICK_DEAD) {
      ship.angle = Math.atan2(dy, dx);
      input.thrust = dist > STICK_THRUST;
      input.thrustPower = Math.min(1, (dist - STICK_THRUST) / (STICK_RADIUS - STICK_THRUST) + 0.35);
    } else {
      input.thrust = false;
      input.thrustPower = 0;
    }
    input.left = false;
    input.right = false;
  }

  function endJoystick() {
    joystick.active = false;
    joystick.touchId = null;
    joystick.dx = 0;
    joystick.dy = 0;
    input.thrust = false;
    input.thrustPower = 0;
  }

  function bindFireButton() {
    function press(e) {
      e.preventDefault();
      if (gameOver) { tryRetry(); return; }
      fireHeld = true;
      fireBtn.classList.add('pressed');
      start();
      fire();
    }
    function release(e) {
      e.preventDefault();
      fireHeld = false;
      fireBtn.classList.remove('pressed');
    }
    fireBtn.addEventListener('touchstart', press, { passive: false });
    fireBtn.addEventListener('touchend', release, { passive: false });
    fireBtn.addEventListener('touchcancel', release, { passive: false });
    fireBtn.addEventListener('mousedown', press);
    fireBtn.addEventListener('mouseup', release);
    fireBtn.addEventListener('mouseleave', release);
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) { tryRetry(); return; }
    for (const t of e.changedTouches) {
      const p = canvasPoint(t.clientX, t.clientY);
      if (p.x > W * 0.58) continue;
      if (!joystick.active) {
        joystick.active = true;
        joystick.touchId = t.identifier;
        joystick.cx = Math.max(60, Math.min(W * 0.42, p.x));
        joystick.cy = Math.max(H * 0.55, Math.min(H - 40, p.y));
        updateJoystick(t.clientX, t.clientY);
        start();
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!joystick.active) return;
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.touchId) updateJoystick(t.clientX, t.clientY);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.touchId) endJoystick();
    }
  }, { passive: false });

  canvas.addEventListener('touchcancel', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joystick.touchId) endJoystick();
    }
  }, { passive: false });

  canvas.addEventListener('click', () => {
    if (gameOver) tryRetry();
    else if (!started) start();
  });

  document.addEventListener('keydown', (e) => {
    if (gameOver && (e.code === 'Space' || e.code === 'Enter')) { tryRetry(); return; }
    if (e.code === 'ArrowLeft') input.left = true;
    if (e.code === 'ArrowRight') input.right = true;
    if (e.code === 'ArrowUp') { input.thrust = true; input.thrustPower = 1; }
    if (e.code === 'Space') { e.preventDefault(); fire(); start(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') input.left = false;
    if (e.code === 'ArrowRight') input.right = false;
    if (e.code === 'ArrowUp') { input.thrust = false; input.thrustPower = 0; }
  });

  function fire() {
    if (!started || gameOver || ship.cooldown > 0) return;
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
    ship.inv = 120;
    ship.vx = 0;
    ship.vy = 0;
    if (lives <= 0) gameOver = true;
  }

  function update() {
    if (!started || gameOver) return;
    if (ship.cooldown > 0) ship.cooldown--;
    if (ship.inv > 0) ship.inv--;
    if (fireHeld) fire();

    if (input.left) ship.angle -= 0.08;
    if (input.right) ship.angle += 0.08;
    if (input.thrust) {
      const power = input.thrustPower || 1;
      ship.vx += Math.cos(ship.angle) * 0.15 * power;
      ship.vy += Math.sin(ship.angle) * 0.15 * power;
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
              const ang = (Math.PI * 2 * k) / 2 + Math.random() * 0.5;
              addAsteroidSafe(
                a.x + Math.cos(ang) * (a.r * 0.6),
                a.y + Math.sin(ang) * (a.r * 0.6),
                a.r * 0.55,
                a.vx + Math.cos(ang) * 1.5,
                a.vy + Math.sin(ang) * 1.5
              );
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

  function drawJoystick() {
    const { cx, cy, dx, dy, active } = joystick;
    ctx.fillStyle = active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.arc(cx, cy, STICK_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, 22, 0, Math.PI * 2);
    ctx.fill();

    if (!started && !gameOver) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('STEER', cx, cy + STICK_RADIUS + 16);
    }
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

    drawJoystick();

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + lives, 8, 20);

    if (!started) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO START', W / 2, H / 2 - 30);
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
      ctx.fillText('Tap to retry', W / 2, H / 2 + 52);
    }
  }

  reset();
  bindFireButton();
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
})();
