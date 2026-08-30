(function () {
  'use strict';

  const THUMBS = {
    flappy(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#4ec0ca');
      g.addColorStop(1, '#70c5ce');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#73bf2e';
      ctx.fillRect(0, h - 22, w, 22);
      ctx.fillStyle = '#5cad26';
      ctx.fillRect(0, h - 22, w, 4);
      ctx.fillStyle = '#6abf4b';
      ctx.fillRect(w * 0.62, 0, 28, h * 0.55);
      ctx.fillRect(w * 0.62, h * 0.72, 28, h);
      ctx.fillStyle = '#debd6a';
      ctx.beginPath();
      ctx.arc(w * 0.34, h * 0.48, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5c99a';
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.44, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(w * 0.44, h * 0.4, 14, 8);
    },

    snake(ctx, w, h) {
      ctx.fillStyle = '#142218';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1f3528';
      for (let x = 0; x < w; x += 12) for (let y = 0; y < h; y += 12) ctx.strokeRect(x, y, 12, 12);
      const segs = [[5, 4], [4, 4], [3, 4], [2, 4], [2, 3], [2, 2]];
      segs.forEach(([cx, cy], i) => {
        ctx.fillStyle = i === 0 ? '#6bff8a' : '#27ae60';
        ctx.fillRect(cx * 12 + 1, cy * 12 + 1, 10, 10);
      });
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(7 * 12 + 3, 2 * 12 + 3, 6, 6);
    },

    pong(ctx, w, h) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, w, h);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.fillRect(w * 0.2, 8, 36, 6);
      ctx.fillRect(w * 0.55, h - 14, 36, 6);
      ctx.beginPath();
      ctx.arc(w * 0.48, h * 0.45, 5, 0, Math.PI * 2);
      ctx.fill();
    },

    breakout(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#4a1942');
      g.addColorStop(1, '#1a0820');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db'];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
        ctx.fillStyle = colors[(r + c) % colors.length];
        ctx.fillRect(8 + c * 19, 10 + r * 10, 17, 8);
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(w * 0.38, h - 16, 34, 6);
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, 4, 0, Math.PI * 2);
      ctx.fill();
    },

    invaders(ctx, w, h) {
      ctx.fillStyle = '#0a0a20';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#6bcb77';
      ctx.fillRect(w * 0.42, h - 14, 24, 6);
      ctx.fillStyle = '#ff6b6b';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
        const x = 14 + c * 24, y = 18 + r * 18;
        ctx.fillRect(x, y + 6, 16, 10);
        ctx.fillRect(x + 2, y, 12, 6);
      }
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(w * 0.46, h * 0.55, 2, 8);
    },

    asteroids(ctx, w, h) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 12; i++) ctx.fillRect((i * 17) % w, (i * 23) % h, 1, 1);
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.35);
      ctx.lineTo(w * 0.3, h * 0.28);
      ctx.lineTo(w * 0.38, h * 0.36);
      ctx.lineTo(w * 0.32, h * 0.48);
      ctx.lineTo(w * 0.18, h * 0.44);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.58);
      ctx.lineTo(w * 0.72, h * 0.52);
      ctx.lineTo(w * 0.68, h * 0.64);
      ctx.closePath();
      ctx.stroke();
    },

    tetris(ctx, w, h) {
      ctx.fillStyle = '#111820';
      ctx.fillRect(0, 0, w, h);
      const cell = 12;
      const ox = (w - cell * 6) / 2;
      const oy = 10;
      const blocks = [
        ['#00f0f0', 1, 0], ['#00f0f0', 2, 0], ['#00f0f0', 3, 0], ['#00f0f0', 4, 0],
        ['#f0f000', 2, 2], ['#f0f000', 3, 2], ['#f0f000', 2, 3], ['#f0f000', 3, 3],
        ['#a000f0', 2, 5], ['#a000f0', 1, 6], ['#a000f0', 2, 6], ['#a000f0', 3, 6],
        ['#f00000', 1, 8], ['#0000f0', 0, 9],
      ];
      blocks.forEach(([c, bx, by]) => {
        ctx.fillStyle = c;
        ctx.fillRect(ox + bx * cell, oy + by * cell, cell - 1, cell - 1);
      });
    },

    two048(ctx, w, h) {
      ctx.fillStyle = '#bbada0';
      ctx.fillRect(0, 0, w, h);
      const grid = [[2, 0, 0, 4], [0, 2, 4, 0], [0, 8, 2, 0], [0, 0, 0, 2]];
      const colors = { 0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179' };
      const cell = 22;
      const ox = (w - cell * 4 - 12) / 2;
      const oy = (h - cell * 4 - 12) / 2;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const v = grid[y][x];
        ctx.fillStyle = colors[v] || '#edc850';
        ctx.fillRect(ox + x * (cell + 4), oy + y * (cell + 4), cell, cell);
        if (v) {
          ctx.fillStyle = v <= 4 ? '#776e65' : '#f9f6f2';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), ox + x * (cell + 4) + cell / 2, oy + y * (cell + 4) + cell / 2 + 4);
        }
      }
    },

    simon(ctx, w, h) {
      ctx.fillStyle = '#0f0f1a';
      ctx.fillRect(0, 0, w, h);
      const colors = ['#e74c3c', '#27ae60', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff6b6b', '#4d96ff'];
      const gw = 24, gh = 22, gap = 4;
      const ox = (w - gw * 3 - gap * 2) / 2;
      const oy = (h - gh * 3 - gap * 2) / 2;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        ctx.fillStyle = colors[r * 3 + c];
        ctx.fillRect(ox + c * (gw + gap), oy + r * (gh + gap), gw, gh);
      }
    },

    frogger(ctx, w, h) {
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(0, 0, w, 16);
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 28, w, 14);
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 50, w, 14);
      ctx.fillStyle = '#1d4e89';
      ctx.fillRect(0, 72, w, 14);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(10, 74, 40, 10);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(60, 30, 30, 10);
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.arc(w / 2, h - 18, 10, 0, Math.PI * 2);
      ctx.fill();
    },

    pacman(ctx, w, h) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2121de';
      ctx.lineWidth = 2;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) {
        if ((x + y) % 2 === 0) ctx.strokeRect(8 + x * 22, 8 + y * 22, 20, 20);
      }
      ctx.fillStyle = '#ffb897';
      [[30, 30], [80, 52], [110, 30]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(w * 0.42, h * 0.55, 12, 0.3, -0.3, true);
      ctx.lineTo(w * 0.42, h * 0.55);
      ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(w * 0.68, h * 0.48, 10, Math.PI, 0);
      ctx.lineTo(w * 0.78, h * 0.58);
      ctx.lineTo(w * 0.58, h * 0.58);
      ctx.fill();
    },

    dino(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#eef6ff');
      g.addColorStop(1, '#f7f7f7');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#bdbdbd';
      ctx.beginPath();
      ctx.moveTo(0, h - 18);
      ctx.lineTo(w, h - 18);
      ctx.stroke();
      ctx.fillStyle = '#444';
      ctx.fillRect(24, h - 38, 22, 20);
      ctx.fillRect(38, h - 46, 10, 8);
      ctx.fillStyle = '#3d7a45';
      ctx.fillRect(w - 36, h - 34, 10, 16);
      ctx.fillRect(w - 44, h - 28, 8, 10);
    },

    missile(ctx, w, h) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#335533';
      ctx.fillRect(0, h - 24, w, 24);
      ctx.fillStyle = '#4d96ff';
      ctx.fillRect(20, h - 32, 18, 14);
      ctx.fillRect(60, h - 32, 18, 14);
      ctx.fillRect(100, h - 32, 18, 14);
      ctx.strokeStyle = 'rgba(255,150,50,0.8)';
      ctx.beginPath();
      ctx.arc(w * 0.55, h * 0.35, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(w * 0.7, 0);
      ctx.lineTo(w * 0.55, h * 0.35);
      ctx.stroke();
    },

    galaga(ctx, w, h) {
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) ctx.fillRect((i * 19) % w, (i * 13) % h, 1, 1);
      ctx.fillStyle = '#ffd700';
      for (let c = 0; c < 4; c++) {
        const x = 16 + c * 28, y = 20;
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x, y + 12);
        ctx.lineTo(x + 16, y + 12);
        ctx.fill();
      }
      ctx.fillStyle = '#4d96ff';
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 18);
      ctx.lineTo(w / 2 - 10, h - 4);
      ctx.lineTo(w / 2 + 10, h - 4);
      ctx.fill();
    },

    racer(ctx, w, h) {
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(w / 2 - 3, 0, 6, h);
      ctx.fillStyle = '#fff';
      for (let y = 6; y < h; y += 20) {
        ctx.fillRect(w * 0.22, y, 4, 10);
        ctx.fillRect(w * 0.72, y, 4, 10);
      }
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(w * 0.18, h * 0.2, 16, 24);
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(w * 0.68, h * 0.35, 16, 24);
      ctx.fillStyle = '#6bcb77';
      ctx.fillRect(w * 0.42, h * 0.62, 16, 24);
    },

    whack(ctx, w, h) {
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, 0, w, h);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const x = 14 + c * 42, y = 22 + r * 38;
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 24, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.arc(72, 48, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(68, 44, 3, 3);
      ctx.fillRect(76, 44, 3, 3);
    },
  };

  function drawAll() {
    document.querySelectorAll('.thumb-canvas').forEach(canvas => {
      const game = canvas.dataset.game;
      const fn = THUMBS[game];
      if (!fn) return;
      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      fn(ctx, w, h);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawAll);
  } else {
    drawAll();
  }
})();
