(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');

  const W = canvas.width, H = canvas.height;
  const BRICK_ROWS = 6, BRICK_COLS = 8, BRICK_W = 34, BRICK_H = 14, BRICK_PAD = 2;
  const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fab', '#c77dff'];

  let paddle = { x: W / 2 - 36, w: 72, h: 10, y: H - 32 };
  let ball = { x: W / 2, y: H / 2, vx: 2.5, vy: -2.5, r: 5 };
  let bricks = [], score = 0, lives = 3, playing = false, won = false;

  function initBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: 4 + c * (BRICK_W + BRICK_PAD),
          y: 48 + r * (BRICK_H + BRICK_PAD),
          w: BRICK_W, h: BRICK_H,
          alive: true,
          color: COLORS[r % COLORS.length],
        });
      }
    }
  }

  function resetBall() {
    ball.x = W / 2; ball.y = H / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 2.5;
    ball.vy = -2.5;
    playing = false;
  }

  function start() {
    if (!playing && lives > 0 && !won) {
      playing = true;
      instructions.classList.add('hidden');
      document.querySelector('#overlay h1').classList.add('hidden');
    }
  }

  function movePaddle(clientX) {
    const rect = canvas.getBoundingClientRect();
    paddle.x = (clientX - rect.left) * (W / rect.width) - paddle.w / 2;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
    start();
  }

  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); movePaddle(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); movePaddle(e.touches[0].clientX); start(); }, { passive: false });
  canvas.addEventListener('mousemove', (e) => movePaddle(e.clientX));
  canvas.addEventListener('click', () => {
    if (won || lives <= 0) { score = 0; lives = 3; won = false; initBricks(); scoreDisplay.textContent = '0'; resetBall(); instructions.classList.remove('hidden'); document.querySelector('#overlay h1').classList.remove('hidden'); }
    else start();
  });

  function update() {
    if (!playing) return;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
    if (ball.y - ball.r < 0) ball.vy *= -1;

    if (ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
      ball.y = paddle.y - ball.r;
      ball.vy = -Math.abs(ball.vy);
      ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 0.06;
    }

    if (ball.y - ball.r > H) {
      lives--;
      if (lives <= 0) playing = false;
      else resetBall();
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
        score += 10;
        scoreDisplay.textContent = score;
        break;
      }
    }

    if (bricks.every(b => !b.alive)) { won = true; playing = false; }
  }

  function draw() {
    ctx.fillStyle = '#1a0820';
    ctx.fillRect(0, 0, W, H);

    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Lives: ' + lives, 8, 20);

    if (!playing && !won && lives > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO LAUNCH', W / 2, H / 2);
    }
    if (won) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', W / 2, H / 2);
      ctx.fillText('Tap to play again', W / 2, H / 2 + 30);
    }
    if (lives <= 0 && !won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2);
      ctx.fillText('Tap to retry', W / 2, H / 2 + 30);
    }
  }

  initBricks();
  resetBall();
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
})();
