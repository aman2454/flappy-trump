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
  const BOARD = Math.min(W, H - 60) - PAD * 2;
  const CELL = BOARD / SIZE;
  const OX = (W - BOARD) / 2;
  const OY = (H - BOARD) / 2 + 24;
  const ANIM_MS = 140;

  const COLORS = {
    0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
    32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850',
    1024: '#edc53f', 2048: '#edc22e',
  };

  let tiles, score, best, over, won, touchStart, animating, animStart, nextId;

  function reset() {
    tiles = [];
    nextId = 1;
    score = 0;
    over = false;
    won = false;
    animating = false;
    best = parseInt(localStorage.getItem('2048best') || '0', 10);
    scoreDisplay.textContent = '0';
    addRandomTile();
    addRandomTile();
    instructions.classList.remove('hidden');
    title.classList.remove('hidden');
  }

  function addRandomTile() {
    const open = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (!tiles.some(t => t.r === r && t.c === c && !t.dead)) open.push({ r, c });
    }
    if (!open.length) return;
    const spot = open[Math.floor(Math.random() * open.length)];
    tiles.push({
      id: nextId++, value: Math.random() < 0.9 ? 2 : 4,
      r: spot.r, c: spot.c, prevR: spot.r, prevC: spot.c,
      isNew: true, dead: false,
    });
  }

  function occupied(r, c, exclude) {
    return tiles.some(t => !t.dead && t !== exclude && t.r === r && t.c === c);
  }

  function canMove() {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const t = tiles.find(x => !x.dead && x.r === r && x.c === c);
      if (!t) return true;
      if (c < SIZE - 1) {
        const right = tiles.find(x => !x.dead && x.r === r && x.c === c + 1);
        if (right && right.value === t.value) return true;
      }
      if (r < SIZE - 1) {
        const down = tiles.find(x => !x.dead && x.r === r + 1 && x.c === c);
        if (down && down.value === t.value) return true;
      }
    }
    return false;
  }

  function move(dir) {
    if (animating) return false;

    const order = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) order.push({ r, c });
    if (dir === 'right') order.sort((a, b) => b.c - a.c || a.r - b.r);
    if (dir === 'left') order.sort((a, b) => a.c - b.c || a.r - b.r);
    if (dir === 'down') order.sort((a, b) => b.r - a.r || a.c - b.c);
    if (dir === 'up') order.sort((a, b) => a.r - b.r || a.c - b.c);

    tiles.forEach(t => { t.prevR = t.r; t.prevC = t.c; t.isNew = false; t.merged = false; });

    let moved = false;

    order.forEach(({ r, c }) => {
      const tile = tiles.find(t => !t.dead && t.r === r && t.c === c && !t.merged);
      if (!tile) return;

      let nr = tile.r, nc = tile.c;
      while (true) {
        let tr = nr, tc = nc;
        if (dir === 'left') tc--;
        if (dir === 'right') tc++;
        if (dir === 'up') tr--;
        if (dir === 'down') tr++;
        if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) break;

        const other = tiles.find(t => !t.dead && t.r === tr && t.c === tc);
        if (!other) { nr = tr; nc = tc; moved = true; continue; }
        if (other.value === tile.value && !other.merged) {
          other.value *= 2;
          other.merged = true;
          score += other.value;
          if (other.value === 2048) won = true;
          tile.dead = true;
          tile.r = tr;
          tile.c = tc;
          moved = true;
        }
        break;
      }
      if (!tile.dead && (nr !== tile.r || nc !== tile.c)) {
        tile.r = nr;
        tile.c = nc;
        moved = true;
      }
    });

    if (!moved) return false;

    animating = true;
    animStart = performance.now();

    setTimeout(() => {
      tiles = tiles.filter(t => !t.dead);
      tiles.forEach(t => { t.prevR = t.r; t.prevC = t.c; t.merged = false; });
      addRandomTile();
      animating = false;
      scoreDisplay.textContent = score;
      if (score > best) { best = score; localStorage.setItem('2048best', String(best)); }
      if (!canMove()) over = true;
    }, ANIM_MS);

    return true;
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

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function draw() {
    ctx.fillStyle = '#bbada0';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#776e65';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Score: ' + score + '  Best: ' + best, W / 2, OY - 12);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = COLORS[0];
        ctx.fillRect(OX + x * CELL + 4, OY + y * CELL + 4, CELL - 8, CELL - 8);
      }
    }

    const progress = animating ? Math.min(1, (performance.now() - animStart) / ANIM_MS) : 1;
    const t = ease(progress);

    tiles.filter(tile => !tile.dead).forEach(tile => {
      const row = tile.prevR + (tile.r - tile.prevR) * t;
      const col = tile.prevC + (tile.c - tile.prevC) * t;
      const pop = tile.isNew && progress < 1 ? ease(progress) : 1;
      const size = (CELL - 8) * pop;
      const px = OX + col * CELL + 4 + ((CELL - 8) - size) / 2;
      const py = OY + row * CELL + 4 + ((CELL - 8) - size) / 2;

      ctx.fillStyle = COLORS[tile.value] || '#3c3a32';
      ctx.fillRect(px, py, size, size);
      if (pop > 0.55) {
        ctx.fillStyle = tile.value <= 4 ? '#776e65' : '#f9f6f2';
        ctx.font = 'bold ' + (tile.value >= 1024 ? 22 : 28) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(String(tile.value), px + size / 2, py + size / 2 + 10);
      }
    });

    if (over || won) {
      ctx.fillStyle = 'rgba(238,228,218,0.75)';
      ctx.fillRect(OX, OY, BOARD, BOARD);
      ctx.fillStyle = '#776e65';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(won && !over ? 'You Win!' : 'Game Over', W / 2, H / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Swipe to restart', W / 2, H / 2 + 30);
    }
  }

  function loop() { draw(); requestAnimationFrame(loop); }

  reset();
  loop();
})();
