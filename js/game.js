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

  const GROUND_HEADLINES = [
    'REFLECTING POOL SAGA',
    'IRAN WAR ESCALATION',
    'RECORD INFLATION',
    'TARIFF CHAOS',
    'CRYPTO RESERVE',
    'DOGE CUTS EVERYTHING',
    'INDICTMENT #47',
    'WALL FUND AWOL',
    'IMMUNITY CLAIM',
    'BORDER CRISIS 2.0',
    'TRUTH SOCIAL RALLY',
    'NUCLEAR THREAT TWEET',
  ];

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
    startGrace = 0;
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
    const groundY = H - GROUND_HEIGHT;
    groundOffset = (groundOffset + PIPE_SPEED) % 180;

    // Grass strip
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(0, groundY, W, 14);

    // Dirt / news ticker band
    ctx.fillStyle = '#c4a574';
    ctx.fillRect(0, groundY + 14, W, GROUND_HEIGHT - 14);

    // Scrolling parody headline banners
    const bannerW = 140;
    const bannerH = 22;
    const bannerY = groundY + 22;
    for (let x = -groundOffset; x < W + bannerW; x += bannerW + 12) {
      drawGroundBanner(x, bannerY, bannerW, bannerH);
    }

    // Second row of smaller signs
    const signY = groundY + 58;
    for (let x = -groundOffset * 0.7 - 40; x < W + 100; x += 110) {
      const idx = Math.floor((x + groundOffset * 0.7) / 110) % GROUND_HEADLINES.length;
      drawGroundSign(x, signY, GROUND_HEADLINES[idx]);
    }

    // Reflecting pool puddle gag (scrolls with ground)
    for (let x = -groundOffset * 0.5; x < W + 60; x += 90) {
      drawReflectingPool(x, groundY + 88);
    }

    // Diagonal hatch texture
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let x = -(groundOffset % 24); x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 14);
      ctx.lineTo(x + 12, H);
      ctx.stroke();
    }
  }

  function drawGroundBanner(x, y, w, h) {
    const idx = Math.abs(Math.floor(x / (w + 12))) % GROUND_HEADLINES.length;
    const text = GROUND_HEADLINES[idx];

    ctx.fillStyle = '#8b0000';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  function drawGroundSign(x, y, text) {
    ctx.fillStyle = '#f5f0e1';
    ctx.fillRect(x, y, 96, 28);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 95, 27);

    // Post
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x + 44, y + 28, 8, 18);

    ctx.fillStyle = '#111';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const short = text.length > 18 ? text.slice(0, 16) + '…' : text;
    ctx.fillText(short, x + 48, y + 14);
  }

  function drawReflectingPool(x, y) {
    ctx.fillStyle = 'rgba(80,160,220,0.55)';
    ctx.beginPath();
    ctx.ellipse(x + 20, y, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 14, y - 2, 8, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Tiny "saga" label
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = '6px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POOL', x + 20, y + 3);
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

    const flapAngle = flapAmount * 0.55;
    const r = bird.radius;

    // Flapping hands (small, recognizable)
    drawHand(-r - 8, 6, -flapAngle - 0.25, true);
    drawHand(r + 8, 6, flapAngle + 0.25, false);

    // Suit shoulders + long red tie
    ctx.fillStyle = '#1c2841';
    ctx.beginPath();
    ctx.moveTo(-r - 4, r - 4);
    ctx.lineTo(-r - 10, r + 14);
    ctx.lineTo(r + 10, r + 14);
    ctx.lineTo(r + 4, r - 4);
    ctx.closePath();
    ctx.fill();

    // White shirt collar
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.moveTo(-8, r - 2);
    ctx.lineTo(0, r + 4);
    ctx.lineTo(8, r - 2);
    ctx.lineTo(5, r - 6);
    ctx.lineTo(0, r - 3);
    ctx.lineTo(-5, r - 6);
    ctx.closePath();
    ctx.fill();

    // Long red tie (iconic)
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.moveTo(-2, r - 2);
    ctx.lineTo(2, r - 2);
    ctx.lineTo(3, r + 16);
    ctx.lineTo(0, r + 20);
    ctx.lineTo(-3, r + 16);
    ctx.closePath();
    ctx.fill();

    // Neck / lower face (wider jowls)
    const faceGrad = ctx.createRadialGradient(-4, 2, 2, 0, 2, r + 2);
    faceGrad.addColorStop(0, '#f0c090');
    faceGrad.addColorStop(0.55, '#e8a060');
    faceGrad.addColorStop(1, '#d4843a');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(0, 3, r + 1, r + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jowl shading
    ctx.fillStyle = 'rgba(180,90,30,0.25)';
    ctx.beginPath();
    ctx.ellipse(-10, 10, 7, 5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(10, 10, 7, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Iconic swept-over blonde hair (more realistic volume)
    ctx.fillStyle = '#f0d060';
    ctx.beginPath();
    ctx.moveTo(-r - 1, -2);
    ctx.bezierCurveTo(-r + 2, -r - 16, r + 2, -r - 18, r + 8, -r - 4);
    ctx.bezierCurveTo(r + 12, -r + 2, r + 6, 2, r + 2, -2);
    ctx.bezierCurveTo(r - 2, -r - 8, 0, -r - 12, -r + 2, -r - 6);
    ctx.bezierCurveTo(-r - 2, -r - 2, -r - 4, 2, -r - 1, -2);
    ctx.fill();

    // Hair highlight sweep
    ctx.strokeStyle = '#fff3a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -r - 8);
    ctx.quadraticCurveTo(8, -r - 14, 16, -r - 2);
    ctx.stroke();

    // Side comb-over wing
    ctx.fillStyle = '#e8c040';
    ctx.beginPath();
    ctx.ellipse(r - 1, -r + 5, 9, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Under-eye bags + squinting eyes
    ctx.fillStyle = 'rgba(200,120,60,0.3)';
    ctx.beginPath();
    ctx.ellipse(-8, 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes — narrow, slightly asymmetrical squint
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-7, -1, 5.5, 3.5, -0.1, 0, Math.PI * 2);
    ctx.ellipse(8, -1, 5.5, 3.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.ellipse(-6, -0.5, 2.8, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -0.5, 2.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy angled eyebrows
    ctx.strokeStyle = '#c8a040';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(-3, -5);
    ctx.moveTo(13, -7);
    ctx.lineTo(3, -5);
    ctx.stroke();

    // Nose
    ctx.fillStyle = 'rgba(210,130,70,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4, 5, 2, 9);
    ctx.quadraticCurveTo(0, 10, -2, 9);
    ctx.quadraticCurveTo(-1, 5, 0, 0);
    ctx.fill();

    // Pursed lips / duck face
    ctx.fillStyle = '#c86858';
    ctx.beginPath();
    ctx.ellipse(0, 12, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a04040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.quadraticCurveTo(0, 14, 5, 12);
    ctx.stroke();

    // Orange makeup line at hair
    ctx.strokeStyle = 'rgba(220,140,60,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -2, r - 1, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    ctx.restore();
  }

  function drawHand(x, y, angle, isLeft) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const skin = '#e8a060';
    const skinDark = '#c87840';

    // Suit sleeve
    ctx.fillStyle = '#1c2841';
    ctx.fillRect(isLeft ? -5 : 0, -1, 5, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(isLeft ? -5 : 0, 7, 5, 2);

    // Wrist
    ctx.fillStyle = skin;
    ctx.fillRect(isLeft ? -6 : 4, 6, 4, 4);

    // Palm — deliberately small
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(isLeft ? -9 : 9, 10, 7, 6, isLeft ? -0.15 : 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Fingers splayed
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const baseX = isLeft ? -11 : 11;
    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.moveTo(baseX, 8);
      ctx.lineTo(baseX + (isLeft ? -2 : 2), 4 + f * 1.5);
      ctx.stroke();
    }

    // Thumb
    ctx.beginPath();
    ctx.moveTo(isLeft ? -6 : 6, 10);
    ctx.lineTo(isLeft ? -4 : 4, 14);
    ctx.stroke();

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
