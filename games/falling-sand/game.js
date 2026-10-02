(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const paletteEl = document.getElementById('palette');
  const btnSize = document.getElementById('btn-size');
  const btnPause = document.getElementById('btn-pause');
  const btnClear = document.getElementById('btn-clear');
  const container = document.getElementById('game-container');

  const EMPTY = 0;
  const SAND = 1;
  const WATER = 2;
  const STONE = 3;
  const WOOD = 4;
  const FIRE = 5;
  const SMOKE = 6;
  const STEAM = 7;
  const OIL = 8;
  const ACID = 9;
  const GAS = 10;
  const LAVA = 11;
  const GUNPOWDER = 12;
  const PLANT = 13;
  const SALT = 14;
  const ICE = 15;
  const CLONE = 16;
  const ERASE = 17;

  const COLORS = {
    [EMPTY]: [13, 11, 9],
    [SAND]: [214, 176, 96],
    [WATER]: [64, 140, 220],
    [STONE]: [110, 110, 118],
    [WOOD]: [120, 72, 36],
    [FIRE]: [255, 120, 40],
    [SMOKE]: [70, 70, 74],
    [STEAM]: [190, 205, 220],
    [OIL]: [90, 55, 20],
    [ACID]: [120, 230, 70],
    [GAS]: [180, 160, 255],
    [LAVA]: [255, 70, 20],
    [GUNPOWDER]: [55, 55, 58],
    [PLANT]: [50, 160, 70],
    [SALT]: [230, 230, 235],
    [ICE]: [170, 220, 245],
    [CLONE]: [220, 90, 200],
  };

  const PALETTE = [
    { id: SAND, name: 'Sand' },
    { id: WATER, name: 'Water' },
    { id: STONE, name: 'Stone' },
    { id: WOOD, name: 'Wood' },
    { id: FIRE, name: 'Fire' },
    { id: OIL, name: 'Oil' },
    { id: ACID, name: 'Acid' },
    { id: GAS, name: 'Gas' },
    { id: LAVA, name: 'Lava' },
    { id: GUNPOWDER, name: 'Powder' },
    { id: PLANT, name: 'Plant' },
    { id: SALT, name: 'Salt' },
    { id: ICE, name: 'Ice' },
    { id: SMOKE, name: 'Smoke' },
    { id: STEAM, name: 'Steam' },
    { id: CLONE, name: 'Clone' },
    { id: ERASE, name: 'Erase' },
  ];

  const BRUSH_SIZES = [1, 3, 6, 10];
  const DENSITY = {
    [EMPTY]: 0, [GAS]: 1, [SMOKE]: 2, [STEAM]: 3, [FIRE]: 4,
    [OIL]: 5, [WATER]: 6, [ACID]: 7, [SAND]: 8, [SALT]: 9,
    [GUNPOWDER]: 10, [ICE]: 11, [WOOD]: 12, [PLANT]: 12, [LAVA]: 13,
    [STONE]: 14, [CLONE]: 15,
  };

  let COLS = 90;
  let ROWS = 140;
  let CELL = 4;
  let grid, life, visited;
  let selected = SAND;
  let brushIndex = 1;
  let paused = false;
  let drawing = false;
  let frame = 0;
  let imageData;

  function colorCss(id) {
    const c = COLORS[id] || [80, 80, 80];
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }

  function buildPalette() {
    paletteEl.innerHTML = '';
    PALETTE.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'el-btn' + (item.id === selected ? ' active' : '');
      btn.textContent = item.name;
      btn.style.background = item.id === ERASE ? '#333' : colorCss(item.id);
      if (item.id === SALT || item.id === ICE || item.id === STEAM) btn.style.color = '#222';
      btn.addEventListener('click', () => {
        selected = item.id;
        [...paletteEl.children].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      paletteEl.appendChild(btn);
    });
  }

  function layout() {
    const hud = document.getElementById('hud');
    const cw = container.clientWidth || window.innerWidth;
    const ch = Math.max(120, (container.clientHeight || window.innerHeight) - (hud ? hud.offsetHeight : 80));
    CELL = Math.max(3, Math.floor(Math.min(cw / 90, ch / 140)));
    COLS = Math.max(40, Math.floor(cw / CELL));
    ROWS = Math.max(60, Math.floor(ch / CELL));
    canvas.width = COLS;
    canvas.height = ROWS;
    canvas.style.width = (COLS * CELL) + 'px';
    canvas.style.height = (ROWS * CELL) + 'px';
    imageData = ctx.createImageData(COLS, ROWS);
    alloc();
  }

  function alloc() {
    const n = COLS * ROWS;
    grid = new Uint8Array(n);
    life = new Uint16Array(n);
    visited = new Uint8Array(n);
  }

  function idx(x, y) { return y * COLS + x; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
  function get(x, y) { return inBounds(x, y) ? grid[idx(x, y)] : STONE; }
  function set(x, y, type, age) {
    if (!inBounds(x, y)) return;
    const i = idx(x, y);
    grid[i] = type;
    life[i] = age || 0;
  }

  function isEmpty(x, y) { return get(x, y) === EMPTY; }
  function isLiquid(t) { return t === WATER || t === OIL || t === ACID || t === LAVA; }
  function isPowder(t) { return t === SAND || t === GUNPOWDER || t === SALT; }
  function isGas(t) { return t === SMOKE || t === STEAM || t === GAS; }
  function isStatic(t) { return t === STONE || t === WOOD || t === PLANT || t === ICE || t === CLONE; }

  function swap(x1, y1, x2, y2) {
    const i = idx(x1, y1), j = idx(x2, y2);
    const t = grid[i], a = life[i];
    grid[i] = grid[j]; life[i] = life[j];
    grid[j] = t; life[j] = a;
    visited[j] = 1;
  }

  function canDisplace(src, dest) {
    if (dest === EMPTY) return true;
    if (isPowder(src) && isLiquid(dest)) return (DENSITY[src] || 0) > (DENSITY[dest] || 0);
    if (isLiquid(src) && isGas(dest)) return true;
    if (src === LAVA && (dest === WATER || dest === OIL)) return false;
    return false;
  }

  function tryMove(x, y, nx, ny) {
    if (!inBounds(nx, ny) || visited[idx(nx, ny)]) return false;
    const src = get(x, y);
    const dest = get(nx, ny);
    if (!canDisplace(src, dest)) return false;
    swap(x, y, nx, ny);
    return true;
  }

  function paintAt(cx, cy) {
    const brush = BRUSH_SIZES[brushIndex];
    const r2 = brush * brush;
    for (let dy = -brush; dy <= brush; dy++) {
      for (let dx = -brush; dx <= brush; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const x = cx + dx, y = cy + dy;
        if (!inBounds(x, y)) continue;
        if (selected === ERASE) set(x, y, EMPTY, 0);
        else if (selected === STONE || selected === CLONE || selected === WOOD || selected === ICE || selected === FIRE || isEmpty(x, y)) {
          set(x, y, selected, 0);
        }
      }
    }
  }

  function explode(x, y, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const t = get(nx, ny);
        if (t === STONE && Math.random() < 0.65) continue;
        if (t === CLONE) continue;
        const roll = Math.random();
        if (roll < 0.4) set(nx, ny, FIRE, 0);
        else if (roll < 0.75) set(nx, ny, SMOKE, 0);
        else set(nx, ny, EMPTY, 0);
      }
    }
  }

  function neighbors(x, y) {
    return [[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]];
  }

  function react(x, y) {
    const type = get(x, y);
    const age = life[idx(x, y)];

    if (type === FIRE) {
      for (const [nx, ny] of neighbors(x, y)) {
        const n = get(nx, ny);
        if (n === WOOD || n === PLANT || n === OIL) set(nx, ny, FIRE, 0);
        else if (n === GUNPOWDER || n === GAS) explode(nx, ny, n === GAS ? 5 : 4);
        else if (n === WATER) { set(x, y, SMOKE, 0); set(nx, ny, STEAM, 0); return; }
        else if (n === ICE && Math.random() < 0.35) set(nx, ny, WATER, 0);
      }
      if (age > 16 + Math.random() * 18) set(x, y, Math.random() < 0.55 ? SMOKE : EMPTY, 0);
      else life[idx(x, y)] = age + 1;
      return;
    }

    if (type === LAVA) {
      for (const [nx, ny] of neighbors(x, y)) {
        const n = get(nx, ny);
        if (n === WATER) { set(x, y, STONE, 0); set(nx, ny, STEAM, 0); return; }
        if (n === WOOD || n === PLANT || n === OIL) set(nx, ny, FIRE, 0);
        if (n === GUNPOWDER) explode(nx, ny, 5);
        if (n === ICE) set(nx, ny, WATER, 0);
      }
      return;
    }

    if (type === ACID) {
      for (const [nx, ny] of neighbors(x, y)) {
        const n = get(nx, ny);
        if ((n === WOOD || n === PLANT || n === STONE || n === SAND || n === SALT) && Math.random() < 0.1) {
          set(nx, ny, EMPTY, 0);
          if (Math.random() < 0.25) set(x, y, EMPTY, 0);
        }
      }
      return;
    }

    if (type === WATER) {
      for (const [nx, ny] of neighbors(x, y)) {
        const n = get(nx, ny);
        if (n === SALT && Math.random() < 0.08) set(nx, ny, EMPTY, 0);
        if (n === LAVA) { set(nx, ny, STONE, 0); set(x, y, STEAM, 0); return; }
        if (n === FIRE && Math.random() < 0.4) { set(nx, ny, SMOKE, 0); set(x, y, STEAM, 0); return; }
      }
      return;
    }

    if (type === PLANT) {
      for (const [nx, ny] of neighbors(x, y)) {
        if (get(nx, ny) === WATER && Math.random() < 0.035) {
          const spots = neighbors(x, y).filter(([ax, ay]) => isEmpty(ax, ay));
          if (spots.length) {
            const [sx, sy] = spots[Math.floor(Math.random() * spots.length)];
            set(sx, sy, PLANT, 0);
            if (Math.random() < 0.25) set(nx, ny, EMPTY, 0);
          }
        }
      }
      return;
    }

    if (type === ICE) {
      for (const [nx, ny] of neighbors(x, y)) {
        if (get(nx, ny) === WATER && Math.random() < 0.015) set(nx, ny, ICE, 0);
        if (get(nx, ny) === LAVA || get(nx, ny) === FIRE) set(x, y, WATER, 0);
      }
      return;
    }

    if (type === CLONE) {
      let sample = EMPTY;
      for (const [nx, ny] of neighbors(x, y)) {
        const n = get(nx, ny);
        if (n !== EMPTY && n !== CLONE) { sample = n; break; }
      }
      if (sample !== EMPTY) {
        for (const [nx, ny] of neighbors(x, y)) {
          if (isEmpty(nx, ny) && Math.random() < 0.12) set(nx, ny, sample, 0);
        }
      }
    }

    if (type === SMOKE && age > 90) set(x, y, EMPTY, 0);
    else if (type === STEAM && age > 110) set(x, y, Math.random() < 0.22 ? WATER : EMPTY, 0);
    else if (type === GAS && age > 150) set(x, y, EMPTY, 0);
    else if (isGas(type)) life[idx(x, y)] = age + 1;
  }

  function updatePowder(x, y) {
    if (tryMove(x, y, x, y + 1)) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryMove(x, y, x + dir, y + 1)) return;
    tryMove(x, y, x - dir, y + 1);
  }

  function updateLiquid(x, y) {
    if (tryMove(x, y, x, y + 1)) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryMove(x, y, x + dir, y + 1)) return;
    if (tryMove(x, y, x - dir, y + 1)) return;
    if (tryMove(x, y, x + dir, y)) return;
    tryMove(x, y, x - dir, y);
  }

  function updateGas(x, y) {
    if (tryMove(x, y, x, y - 1)) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (tryMove(x, y, x + dir, y - 1)) return;
    if (tryMove(x, y, x - dir, y - 1)) return;
    if (tryMove(x, y, x + dir, y)) return;
    tryMove(x, y, x - dir, y);
  }

  function updateFire(x, y) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < 0.45) tryMove(x, y, x + dir, y - 1);
    else if (Math.random() < 0.3) tryMove(x, y, x, y - 1);
  }

  function step() {
    visited.fill(0);
    const leftToRight = frame % 2 === 0;

    for (let y = ROWS - 1; y >= 0; y--) {
      for (let xi = 0; xi < COLS; xi++) {
        const x = leftToRight ? xi : COLS - 1 - xi;
        const i = idx(x, y);
        if (visited[i]) continue;
        const type = grid[i];
        if (type === EMPTY) continue;

        react(x, y);
        if (grid[i] !== type) { visited[i] = 1; continue; }

        if (isPowder(type)) updatePowder(x, y);
        else if (isLiquid(type)) updateLiquid(x, y);
        else if (isGas(type)) updateGas(x, y);
        else if (type === FIRE) updateFire(x, y);
      }
    }

    // Top-down pass helps rising gases / clone / plant growth reactions
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = get(x, y);
        if (type === CLONE || type === PLANT || type === ICE) react(x, y);
      }
    }
  }

  function draw() {
    const data = imageData.data;
    for (let i = 0; i < grid.length; i++) {
      let c = COLORS[grid[i]] || COLORS[EMPTY];
      const t = grid[i];
      if (t === FIRE) c = [255, 70 + ((frame + i) % 90), 15];
      else if (t === LAVA) c = [255, 35 + ((i * 3) % 55), 8];
      else if (t === WATER) c = [50 + (i % 8), 125 + (i % 6), 205 + (i % 4)];
      else if (t === GAS) c = [170 + (i % 20), 150, 255];
      const p = i * 4;
      data[p] = c[0];
      data[p + 1] = c[1];
      data[p + 2] = c[2];
      data[p + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function canvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor((clientX - rect.left) * (COLS / rect.width)),
      y: Math.floor((clientY - rect.top) * (ROWS / rect.height)),
    };
  }

  function onPointer(clientX, clientY) {
    const p = canvasCoords(clientX, clientY);
    paintAt(p.x, p.y);
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    drawing = true;
    onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (drawing) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  canvas.addEventListener('touchend', () => { drawing = false; });
  canvas.addEventListener('touchcancel', () => { drawing = false; });
  canvas.addEventListener('mousedown', e => { drawing = true; onPointer(e.clientX, e.clientY); });
  canvas.addEventListener('mousemove', e => { if (drawing) onPointer(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { drawing = false; });

  btnSize.addEventListener('click', () => {
    brushIndex = (brushIndex + 1) % BRUSH_SIZES.length;
    btnSize.textContent = 'Brush ' + BRUSH_SIZES[brushIndex];
  });
  btnPause.addEventListener('click', () => {
    paused = !paused;
    btnPause.textContent = paused ? 'Play' : 'Pause';
  });
  btnClear.addEventListener('click', () => { grid.fill(0); life.fill(0); });

  function onResize() {
    const snapshot = grid ? Uint8Array.from(grid) : null;
    const oldCols = COLS, oldRows = ROWS;
    layout();
    if (snapshot) {
      for (let y = 0; y < Math.min(oldRows, ROWS); y++) {
        for (let x = 0; x < Math.min(oldCols, COLS); x++) {
          grid[idx(x, y)] = snapshot[y * oldCols + x];
        }
      }
    }
  }

  window.addEventListener('resize', onResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

  function loop() {
    frame++;
    if (!paused) step();
    draw();
    requestAnimationFrame(loop);
  }

  buildPalette();
  layout();
  for (let x = Math.floor(COLS * 0.3); x < Math.floor(COLS * 0.7); x++) {
    for (let y = Math.floor(ROWS * 0.18); y < Math.floor(ROWS * 0.26); y++) {
      if (((x * 13 + y * 7) % 5) !== 0) set(x, y, SAND, 0);
    }
  }
  loop();
})();
