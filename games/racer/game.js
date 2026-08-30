(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const LANES = 4;
  const LANE_W = W / LANES;
  const ONCOMING_LANES = [0, 1];
  const SAME_DIR_LANES = [2, 3];
  const LANE_CHANGE_SPEED = 0.11;

  let car, obstacles, score, speed, playing, dead, frame, roadOffset, best, touchStart;

  function laneCenter(lane) {
    return LANE_W * lane + LANE_W / 2;
  }

  function nearestLane(x) {
    return Math.max(0, Math.min(LANES - 1, Math.round((x - LANE_W / 2) / LANE_W)));
  }

  function reset() {
    car = {
      lane: 2,
      targetLane: 2,
      x: laneCenter(2),
      y: H - 100,
      w: 34,
      h: 52,
    };
    obstacles = [];
    score = 0;
    speed = 4;
    playing = false;
    dead = false;
    frame = 0;
    roadOffset = 0;
    best = parseInt(localStorage.getItem('racerBest') || '0', 10);
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

  function nudgeLane(dir) {
    start();
    car.targetLane = Math.max(0, Math.min(LANES - 1, car.targetLane + dir));
  }

  function setLaneFromX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    start();
    car.targetLane = Math.max(0, Math.min(LANES - 1, Math.floor(x / LANE_W)));
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setLaneFromX(e.touches[0].clientX);
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    setLaneFromX(e.touches[0].clientX);
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    touchStart = null;
    if (Math.abs(dx) > 28) nudgeLane(dx > 0 ? 1 : -1);
  }, { passive: false });

  canvas.addEventListener('mousemove', e => setLaneFromX(e.clientX));
  canvas.addEventListener('click', start);

  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') nudgeLane(-1);
    if (e.code === 'ArrowRight') nudgeLane(1);
  });

  function spawnSameDir() {
    const lane = SAME_DIR_LANES[Math.floor(Math.random() * SAME_DIR_LANES.length)];
    obstacles.push({
      lane,
      y: -90,
      w: 32,
      h: 48,
      oncoming: false,
      color: ['#e74c3c', '#3498db', '#f39c12'][Math.floor(Math.random() * 3)],
    });
  }

  function spawnOncoming() {
    const lane = ONCOMING_LANES[Math.floor(Math.random() * ONCOMING_LANES.length)];
    obstacles.push({
      lane,
      y: -90,
      w: 32,
      h: 48,
      oncoming: true,
      color: ['#c0392b', '#2980b9', '#d35400'][Math.floor(Math.random() * 3)],
    });
  }

  function drawCar(x, y, w, h, color, facingUp) {
    ctx.fillStyle = color;
    if (facingUp) {
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(x - w / 2 + 5, y - h / 2 + 6, w - 10, 10);
      ctx.fillStyle = '#222';
      ctx.fillRect(x - 7, y + h / 2 - 10, 6, 8);
      ctx.fillRect(x + 1, y + h / 2 - 10, 6, 8);
    } else {
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(x - w / 2 + 5, y + h / 2 - 16, w - 10, 10);
      ctx.fillStyle = '#222';
      ctx.fillRect(x - 7, y - h / 2 + 2, 6, 8);
      ctx.fillRect(x + 1, y - h / 2 + 2, 6, 8);
    }
  }

  function update() {
    if (!playing || dead) return;
    frame++;
    score = Math.floor(frame / 4);
    scoreDisplay.textContent = score;
    speed = 4 + Math.floor(score / 200) * 0.5;
    roadOffset = (roadOffset + speed) % 40;

    const targetX = laneCenter(car.targetLane);
    car.x += (targetX - car.x) * LANE_CHANGE_SPEED;
    car.lane = nearestLane(car.x);

    const spawnRate = Math.max(32, 58 - Math.floor(score / 100) * 3);
    if (frame % spawnRate === 0) spawnSameDir();
    if (frame % Math.max(40, spawnRate + 8) === 0) spawnOncoming();

    obstacles.forEach(o => {
      o.y += o.oncoming ? speed * 1.25 : speed * 0.7;
    });
    obstacles = obstacles.filter(o => o.y > -120 && o.y < H + 120);

    const cy = car.y;
    for (const o of obstacles) {
      const ox = laneCenter(o.lane);
      const hitLane = Math.abs(ox - car.x) < LANE_W * 0.42;
      if (hitLane && o.y + o.h / 2 > cy - car.h / 2 && o.y - o.h / 2 < cy + car.h / 2) {
        dead = true;
        playing = false;
        if (score > best) { best = score; localStorage.setItem('racerBest', String(best)); }
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(LANE_W * 2 - 4, 0, 8, H);

    for (let i = 0; i <= LANES; i++) {
      ctx.strokeStyle = i === 2 ? '#1e8449' : '#555';
      ctx.setLineDash(i === 2 || i === 0 ? [] : [18, 18]);
      ctx.lineWidth = i === 2 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    for (let y = -40 + roadOffset; y < H; y += 40) {
      ctx.fillRect(LANE_W - 3, y, 6, 18);
      ctx.fillRect(LANE_W * 3 - 3, y, 6, 18);
    }

    obstacles.forEach(o => {
      drawCar(laneCenter(o.lane), o.y, o.w, o.h, o.color, !o.oncoming);
    });

    drawCar(car.x, car.y, car.w, car.h, '#6bcb77', true);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ONCOMING ←', LANE_W, 14);
    ctx.fillText('→ TRAFFIC', LANE_W * 3, 14);

    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 10);
      ctx.font = '14px Arial';
      ctx.fillText('Score: ' + score + '  Best: ' + best, W / 2, H / 2 + 16);
      ctx.fillText('Tap to restart', W / 2, H / 2 + 40);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
