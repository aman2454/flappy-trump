(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const BASE_Y = H - 50;
  const CITY_COUNT = 6;

  let cities, missiles, explosions, score, ammo, wave, playing, dead, frame;

  function reset() {
    cities = Array.from({ length: CITY_COUNT }, (_, i) => ({
      x: 30 + i * ((W - 60) / (CITY_COUNT - 1)),
      alive: true,
    }));
    missiles = [];
    explosions = [];
    score = 0;
    ammo = 30;
    wave = 1;
    playing = false;
    dead = false;
    frame = 0;
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

  function spawnMissile() {
    const target = cities.filter(c => c.alive);
    if (!target.length) return;
    const t = target[Math.floor(Math.random() * target.length)];
    missiles.push({
      x: Math.random() * W,
      y: 0,
      tx: t.x,
      ty: BASE_Y,
      trail: [],
    });
  }

  function tap(x, y) {
    start();
    if (!playing || ammo <= 0) return;
    ammo--;
    explosions.push({ x, y, r: 4, max: 42 + wave * 2, life: 40 });
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    tap((e.touches[0].clientX - rect.left) * (W / rect.width),
        (e.touches[0].clientY - rect.top) * (H / rect.height));
  }, { passive: false });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    tap((e.clientX - rect.left) * (W / rect.width),
        (e.clientY - rect.top) * (H / rect.height));
  });

  function update() {
    if (!playing || dead) return;
    frame++;
    scoreDisplay.textContent = score + '  Ammo: ' + ammo;

    if (frame % Math.max(40, 80 - wave * 5) === 0) spawnMissile();
    if (frame % 600 === 0) { wave++; ammo += 10; }

    missiles.forEach(m => {
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 12) m.trail.shift();
      const dx = m.tx - m.x, dy = m.ty - m.y;
      const dist = Math.hypot(dx, dy);
      const spd = 1.2 + wave * 0.08;
      if (dist < spd) {
        cities.forEach(c => { if (Math.abs(c.x - m.tx) < 24) c.alive = false; });
        m.dead = true;
      } else {
        m.x += (dx / dist) * spd;
        m.y += (dy / dist) * spd;
      }
    });
    missiles = missiles.filter(m => !m.dead);

    explosions.forEach(ex => {
      ex.r += 1.2;
      ex.life--;
    });
    explosions = explosions.filter(ex => ex.life > 0);

    missiles.forEach(m => {
      explosions.forEach(ex => {
        if (Math.hypot(m.x - ex.x, m.y - ex.y) < ex.r) {
          m.dead = true;
          score += 25;
        }
      });
    });
    missiles = missiles.filter(m => !m.dead);

    if (!cities.some(c => c.alive) || (ammo <= 0 && missiles.length === 0 && explosions.length === 0)) {
      dead = true;
      playing = false;
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#335533';
    ctx.fillRect(0, BASE_Y, W, H - BASE_Y);

    cities.forEach(c => {
      if (!c.alive) return;
      ctx.fillStyle = '#4d96ff';
      ctx.fillRect(c.x - 14, BASE_Y - 20, 28, 20);
      ctx.fillRect(c.x - 6, BASE_Y - 32, 12, 12);
    });

    missiles.forEach(m => {
      ctx.strokeStyle = 'rgba(255,100,100,0.4)';
      ctx.beginPath();
      m.trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    explosions.forEach(ex => {
      ctx.strokeStyle = 'rgba(255,200,100,' + (ex.life / 40) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,150,50,' + (ex.life / 60) + ')';
      ctx.fill();
    });

    ctx.fillStyle = '#fff';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Wave ' + wave, 8, 20);

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(cities.some(c => c.alive) ? 'OUT OF AMMO' : 'CITIES DESTROYED', W / 2, H / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + ' · Tap to restart', W / 2, H / 2 + 28);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
