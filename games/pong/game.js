(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');

  const W = canvas.width, H = canvas.height;
  const PADDLE_W = 64, PADDLE_H = 10;
  const BALL_R = 6;

  let player = { x: W / 2 - PADDLE_W / 2, y: H - 36 };
  let ai = { x: W / 2 - PADDLE_W / 2, y: 24 };
  let ball = { x: W / 2, y: H / 2, vx: 3, vy: 3 };
  let playerScore = 0, aiScore = 0;
  let playing = false;
  let frame = 0;

  function resetBall(dir) {
    ball.x = W / 2; ball.y = H / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3;
    ball.vy = dir * 3.5;
    playing = false;
  }

  function start() {
    if (!playing) {
      playing = true;
      instructions.classList.add('hidden');
      overlay.querySelector('h1').classList.add('hidden');
    }
  }

  function movePlayer(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    player.x = (clientX - rect.left) * scale - PADDLE_W / 2;
    player.x = Math.max(0, Math.min(W - PADDLE_W, player.x));
    start();
  }

  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); movePlayer(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer(e.touches[0].clientX); start(); }, { passive: false });
  canvas.addEventListener('mousemove', (e) => movePlayer(e.clientX));
  canvas.addEventListener('click', start);

  function update() {
    if (!playing) return;
    frame++;

    ai.x += (ball.x - (ai.x + PADDLE_W / 2)) * 0.06;
    ai.x = Math.max(0, Math.min(W - PADDLE_W, ai.x));

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx *= -1; }
    if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx *= -1; }

    if (ball.y - BALL_R < 0) {
      playerScore++;
      scoreDisplay.textContent = playerScore + ' - ' + aiScore;
      resetBall(1);
    }
    if (ball.y + BALL_R > H) {
      aiScore++;
      scoreDisplay.textContent = playerScore + ' - ' + aiScore;
      resetBall(-1);
    }

    if (ball.y + BALL_R >= player.y && ball.y - BALL_R <= player.y + PADDLE_H &&
        ball.x >= player.x && ball.x <= player.x + PADDLE_W) {
      ball.y = player.y - BALL_R;
      ball.vy = -Math.abs(ball.vy) - 0.2;
      ball.vx += (ball.x - (player.x + PADDLE_W / 2)) * 0.08;
    }
    if (ball.y - BALL_R <= ai.y + PADDLE_H && ball.y + BALL_R >= ai.y &&
        ball.x >= ai.x && ball.x <= ai.x + PADDLE_W) {
      ball.y = ai.y + PADDLE_H + BALL_R;
      ball.vy = Math.abs(ball.vy) + 0.2;
      ball.vx += (ball.x - (ai.x + PADDLE_W / 2)) * 0.08;
    }

    ball.vx = Math.max(-5, Math.min(5, ball.vx));
    ball.vy = Math.max(-6, Math.min(6, ball.vy));
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, PADDLE_W, PADDLE_H);
    ctx.fillStyle = '#888';
    ctx.fillRect(ai.x, ai.y, PADDLE_W, PADDLE_H);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    if (!playing) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO SERVE', W / 2, H / 2);
    }
  }

  resetBall(Math.random() > 0.5 ? 1 : -1);
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
})();
