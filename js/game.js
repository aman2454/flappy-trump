(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');

  const W = canvas.width;
  const H = canvas.height;

  // Original Flappy Bird physics constants
  const GRAVITY = 0.25;
  const JUMP = -4.6;
  const MAX_VEL = 10;
  const PIPE_SPEED = 2;
  const PIPE_WIDTH = 52;
  const PIPE_GAP = 100;
  const PIPE_SPAWN_INTERVAL = 90; // frames (~1.5s at 60fps)
  const GROUND_HEIGHT = 112;
  const BIRD_X = 50;

  const STATE = { READY: 0, PLAYING: 1, DEAD: 2 };

  let state = STATE.READY;
  let frame = 0;
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('flappyTrumpBest') || '0', 10);

  const bird = {
    y: H / 2 - 40,
    vel: 0,
    rotation: 0,
    flapFrame: 0,
    radius: 18,
  };

  let pipes = [];
  let pipeTimer = 0;
  let groundOffset = 0;

  let startGrace = 0;

  // --- Input ---
  function flap() {
    if (state === STATE.READY) {
      state = STATE.PLAYING;
      startGrace = 15;
      instructions.classList.add('hidden');
      overlay.querySelector('h1').classList.add('hidden');
      bird.vel = JUMP;
      bird.flapFrame = 8;
    } else if (state === STATE.PLAYING) {
      bird.vel = JUMP;
      bird.flapFrame = 8;
    } else if (state === STATE.DEAD) {
      resetGame();
    }
  }

  canvas.addEventListener('click', flap);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      flap();
    }
  });

  // --- Reset ---
  function resetGame() {
    state = STATE.READY;
    frame = 0;
    score = 0;
    bird.y = H / 2 - 40;
    bird.vel = 0;
    bird.rotation = 0;
    bird.flapFrame = 0;
    pipes = [];
    pipeTimer = 0;
    groundOffset = 0;
    scoreDisplay.textContent = '';
    instructions.classList.remove('hidden');
    overlay.querySelector('h1').classList.remove('hidden');
  }

  // --- Pipe management ---
  function spawnPipe() {
    const minTop = 60;
    const maxTop = H - GROUND_HEIGHT - PIPE_GAP - 60;
    const topHeight = minTop + Math.random() * (maxTop - minTop);
    pipes.push({
      x: W,
      topHeight,
      scored: false,
    });
  }

  function updatePipes() {
    pipeTimer++;
    if (pipeTimer >= PIPE_SPAWN_INTERVAL) {
      spawnPipe();
      pipeTimer = 0;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= PIPE_SPEED;

      if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < BIRD_X) {
        pipes[i].scored = true;
        score++;
        scoreDisplay.textContent = score;
      }

      if (pipes[i].x + PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
      }
    }
  }

  // --- Collision ---
  function checkCollision() {
    if (startGrace > 0) return false;

    const bx = BIRD_X;
    const by = bird.y;
    const br = bird.radius - 2;

    // Ground / ceiling
    if (by + br >= H - GROUND_HEIGHT || by - br <= 0) return true;

    for (const pipe of pipes) {
      const inX = bx + br > pipe.x && bx - br < pipe.x + PIPE_WIDTH;
      if (!inX) continue;

      const inTop = by - br < pipe.topHeight;
      const inBottom = by + br > pipe.topHeight + PIPE_GAP;
      if (inTop || inBottom) return true;
    }
    return false;
  }

  // --- Drawing helpers ---
  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_HEIGHT);
    grad.addColorStop(0, '#4ec0ca');
    grad.addColorStop(1, '#70c5ce');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H - GROUND_HEIGHT);
  }

  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const offset = (frame * 0.3) % W;
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 120 - offset) % (W + 80)) - 40;
      const cy = 60 + i * 40;
      drawCloud(cx, cy, 30 + i * 5);
    }
  }

  function drawCloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.8, y - r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 1.5, y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround() {
    groundOffset = (groundOffset + PIPE_SPEED) % 24;
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(0, H - GROUND_HEIGHT, W, 14);

    ctx.strokeStyle = '#c8b86a';
    ctx.lineWidth = 2;
    for (let x = -groundOffset; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, H - GROUND_HEIGHT + 14);
      ctx.lineTo(x + 12, H);
      ctx.stroke();
    }
  }

  function drawPipe(x, topHeight) {
    const bottomY = topHeight + PIPE_GAP;
    const bottomHeight = H - GROUND_HEIGHT - bottomY;

    // Top pipe
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);
    ctx.fillStyle = '#5a9624';
    ctx.fillRect(x, topHeight - 26, PIPE_WIDTH + 4, 26);
    ctx.fillStyle = '#8ed637';
    ctx.fillRect(x + 2, 0, 6, topHeight);
    ctx.fillRect(x + PIPE_WIDTH - 8, 0, 6, topHeight);

    // Bottom pipe
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomHeight);
    ctx.fillStyle = '#5a9624';
    ctx.fillRect(x, bottomY, PIPE_WIDTH + 4, 26);
    ctx.fillStyle = '#8ed637';
    ctx.fillRect(x + 2, bottomY, 6, bottomHeight);
    ctx.fillRect(x + PIPE_WIDTH - 8, bottomY, 6, bottomHeight);
  }

  function drawTrumpHead(x, y, rotation, flapAmount) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const flapAngle = flapAmount * 0.6;

    // Left hand
    drawHand(-bird.radius - 6, 4, -flapAngle - 0.3, true);
    // Right hand
    drawHand(bird.radius + 6, 4, flapAngle + 0.3, false);

    // Hair (blonde, swept back)
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.moveTo(-bird.radius - 2, -8);
    ctx.quadraticCurveTo(-bird.radius + 4, -bird.radius - 14, bird.radius + 6, -bird.radius - 6);
    ctx.quadraticCurveTo(bird.radius + 10, -bird.radius - 2, bird.radius + 4, -6);
    ctx.quadraticCurveTo(0, -bird.radius - 10, -bird.radius - 2, -8);
    ctx.fill();

    // Face
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();

    // Hair sides
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.ellipse(-bird.radius + 2, -bird.radius + 6, 8, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bird.radius - 2, -bird.radius + 4, 10, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-7, -3, 6, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -3, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(8, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(-2, -6);
    ctx.moveTo(12, -8);
    ctx.lineTo(2, -6);
    ctx.stroke();

    // Mouth
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(0, 8, 8, 4, 0, 0, Math.PI);
    ctx.fill();

    // Suit collar hint
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(-10, bird.radius - 2);
    ctx.lineTo(0, bird.radius + 6);
    ctx.lineTo(10, bird.radius - 2);
    ctx.fill();

    ctx.restore();
  }

  function drawHand(x, y, angle, isLeft) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Arm stub
    ctx.fillStyle = '#f4a460';
    ctx.fillRect(isLeft ? -4 : 0, -2, 4, 8);

    // Hand (small, with fingers)
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.ellipse(isLeft ? -8 : 8, 2, 9, 7, isLeft ? -0.2 : 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Fingers
    ctx.strokeStyle = '#e8944a';
    ctx.lineWidth = 1.5;
    const fingerBase = isLeft ? -12 : 12;
    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.moveTo(fingerBase, 0);
      ctx.lineTo(fingerBase + (isLeft ? -3 : 3), -4 + f * 2.5);
      ctx.stroke();
    }

    // Red tie cuff hint on sleeve
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(isLeft ? -4 : 0, 4, 4, 2);

    ctx.restore();
  }

  function drawGetReady() {
    if (state !== STATE.READY) return;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 20px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GET READY', W / 2, H / 2 + 60);
    ctx.font = '14px Arial';
    ctx.fillText('Tap to Start', W / 2, H / 2 + 85);
  }

  function drawGameOver() {
    if (state !== STATE.DEAD) return;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 30);

    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, W / 2, H / 2 + 5);
    ctx.fillText('Best: ' + bestScore, W / 2, H / 2 + 30);

    ctx.font = '14px Arial';
    ctx.fillText('Tap to Restart', W / 2, H / 2 + 65);
  }

  // --- Update ---
  function update() {
    frame++;

    if (state === STATE.PLAYING) {
      bird.vel += GRAVITY;
      if (bird.vel > MAX_VEL) bird.vel = MAX_VEL;
      bird.y += bird.vel;

      // Rotation based on velocity (like original)
      bird.rotation = Math.min(Math.max(bird.vel * 0.05, -0.5), 1.2);

      if (bird.flapFrame > 0) bird.flapFrame--;
      if (startGrace > 0) startGrace--;

      updatePipes();

      if (checkCollision()) {
        state = STATE.DEAD;
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem('flappyTrumpBest', String(bestScore));
        }
      }
    }

    if (state === STATE.READY) {
      bird.y = H / 2 - 40 + Math.sin(frame * 0.05) * 5;
      bird.rotation = 0;
      if (bird.flapFrame > 0) bird.flapFrame--;
    }
  }

  // --- Render ---
  function render() {
    drawSky();
    drawClouds();

    for (const pipe of pipes) {
      drawPipe(pipe.x, pipe.topHeight);
    }

    drawGround();

    const flapAmount = bird.flapFrame > 0 ? bird.flapFrame / 8 : 0;
    drawTrumpHead(BIRD_X, bird.y, bird.rotation, flapAmount);

    drawGetReady();
    drawGameOver();
  }

  // --- Game loop ---
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
