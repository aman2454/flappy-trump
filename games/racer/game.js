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

  let car, obstacles, score, speed, playing, dead, frame, roadOffset, best;

  function reset() {
    car = { lane: 1, x: LANE_W * 1.5, y: H - 100, w: 36, h: 56 };
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

  function setLaneFromX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    const lane = Math.max(0, Math.min(LANES - 1, Math.floor(x / LANE_W)));
    car.lane = lane;
    car.x = LANE_W * lane + LANE_W / 2;
    start();
  }

  canvas.addEventListener('touchmove', e => { e.preventDefault(); setLaneFromX(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); setLaneFromX(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('mousemove', e => setLaneFromX(e.clientX));
  canvas.addEventListener('click', start);

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANES);
    obstacles.push({ lane, y: -80, w: 34, h: 50, color: ['#e74c3c','#3498db','#f39c12'][Math.floor(Math.random()*3)] });
  }

  function update() {
    if (!playing || dead) return;
    frame++;
    score = Math.floor(frame / 4);
    scoreDisplay.textContent = score;
    speed = 4 + Math.floor(score / 200) * 0.5;
    roadOffset = (roadOffset + speed) % 40;

    if (frame % Math.max(35, 60 - Math.floor(score / 100) * 3) === 0) spawnObstacle();

    obstacles.forEach(o => { o.y += speed; });
    obstacles = obstacles.filter(o => o.y < H + 20);

    const cx = car.x, cy = car.y;
    for (const o of obstacles) {
      const ox = LANE_W * o.lane + LANE_W / 2;
      if (Math.abs(o.lane - car.lane) < 1 && o.y + o.h > cy - car.h / 2 && o.y < cy + car.h / 2) {
        dead = true;
        playing = false;
        if (score > best) { best = score; localStorage.setItem('racerBest', String(best)); }
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < LANES; i++) {
      ctx.strokeStyle = '#555';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    for (let y = -40 + roadOffset; y < H; y += 40) {
      ctx.fillRect(W / 2 - 3, y, 6, 20);
    }

    obstacles.forEach(o => {
      ctx.fillStyle = o.color;
      ctx.fillRect(LANE_W * o.lane + LANE_W / 2 - o.w / 2, o.y, o.w, o.h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(LANE_W * o.lane + LANE_W / 2 - o.w / 2 + 4, o.y + 8, o.w - 8, 12);
    });

    ctx.fillStyle = '#6bcb77';
    ctx.fillRect(car.x - car.w / 2, car.y - car.h / 2, car.w, car.h);
    ctx.fillStyle = '#333';
    ctx.fillRect(car.x - 8, car.y - car.h / 2 + 8, 16, 20);

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
