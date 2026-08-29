(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const instructions = document.getElementById('instructions');
  const scoreDisplay = document.getElementById('score-display');
  const title = document.querySelector('#overlay h1');

  const W = canvas.width, H = canvas.height;
  const SIZE = 4;
  const PAD = 16;
  const BOARD = Math.min(W, H) - PAD * 2;
  const CELL = BOARD / SIZE;
  const OX = (W - BOARD) / 2;
  const OY = (H - BOARD) / 2 + 20;

  const COLORS = {
    0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
    32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850',
    1024: '#edc53f', 2048: '#edc22e',
  };

  let grid, score, best, over, won, touchStart;

  function empty() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

  function reset() {
    grid = empty();
    score = 0;
    over = false;
    won = false;
    best = parseInt(localStorage.getItem('2048best') || '0', 10);
    scoreDisplay.textContent = '0';
    addTile();
    addTile();
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function addTile() {
    const emptyCells = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!grid[y][x]) emptyCells.push({ x, y });
    if (!emptyCells.length) return;
    const c = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[c.y][c.x] = Math.random() < 0.9 ? 2 : 4;
  }

  function slide(row) {
    const arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        if (arr[i] === 2048) won = true;
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < SIZE) arr.push(0);
    return arr;
  }

  function move(dir) {
    let moved = false;
    const ng = empty();
    if (dir === 'left') {
      for (let y = 0; y < SIZE; y++) {
        const r = slide(grid[y]);
        ng[y] = r;
        if (r.join() !== grid[y].join()) moved = true;
      }
    } else if (dir === 'right') {
      for (let y = 0; y < SIZE; y++) {
        const r = slide(grid[y].slice().reverse()).reverse();
        ng[y] = r;
        if (r.join() !== grid[y].join()) moved = true;
      }
    } else if (dir === 'up') {
      for (let x = 0; x < SIZE; x++) {
        const col = [];
        for (let y = 0; y < SIZE; y++) col.push(grid[y][x]);
        const r = slide(col);
        for (let y = 0; y < SIZE; y++) ng[y][x] = r[y];
        if (r.join() !== col.join()) moved = true;
      }
    } else if (dir === 'down') {
      for (let x = 0; x < SIZE; x++) {
        const col = [];
        for (let y = SIZE - 1; y >= 0; y--) col.push(grid[y][x]);
        const r = slide(col);
        for (let y = 0; y < SIZE; y++) ng[SIZE - 1 - y][x] = r[y];
        if (r.slice().reverse().join() !== col.slice().reverse().join()) moved = true;
      }
    }
    if (moved) {
      grid = ng;
      addTile();
      scoreDisplay.textContent = score;
      if (score > best) { best = score; localStorage.setItem('2048best', String(best)); }
      if (!canMove()) over = true;
    }
    return moved;
  }

  function canMove() {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (!grid[y][x]) return true;
      if (x < SIZE - 1 && grid[y][x] === grid[y][x + 1]) return true;
      if (y < SIZE - 1 && grid[y][x] === grid[y + 1][x]) return true;
    }
    return false;
  }

  function start() {
    instructions.classList.add('hidden');
    title.classList.add('hidden');
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    start();
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (over) { reset(); start(); return; }
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  }, { passive: false });

  document.addEventListener('keydown', e => {
    start();
    if (over && e.code === 'Enter') { reset(); return; }
    if (e.code === 'ArrowLeft') move('left');
    if (e.code === 'ArrowRight') move('right');
    if (e.code === 'ArrowUp') move('up');
    if (e.code === 'ArrowDown') move('down');
  });

  function draw() {
    ctx.fillStyle = '#bbada0';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#776e65';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Score: ' + score + '  Best: ' + best, W / 2, OY - 12);

    ctx.fillStyle = '#bbada0';
    ctx.fillRect(OX, OY, BOARD, BOARD);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = grid[y][x];
        const px = OX + x * CELL + 4;
        const py = OY + y * CELL + 4;
        ctx.fillStyle = COLORS[v] || '#3c3a32';
        ctx.fillRect(px, py, CELL - 8, CELL - 8);
        if (v) {
          ctx.fillStyle = v <= 4 ? '#776e65' : '#f9f6f2';
          ctx.font = 'bold ' + (v >= 1024 ? 22 : 28) + 'px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), px + (CELL - 8) / 2, py + (CELL - 8) / 2 + 10);
        }
      }
    }

    if (over || won) {
      ctx.fillStyle = 'rgba(238,228,218,0.75)';
      ctx.fillRect(OX, OY, BOARD, BOARD);
      ctx.fillStyle = '#776e65';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(won && !over ? 'You Win!' : 'Game Over', W / 2, H / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Swipe to restart', W / 2, H / 2 + 30);
    }
  }

  function loop() { draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
