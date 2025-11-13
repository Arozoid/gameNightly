const mapPixelWidth = 512 * 64;   // map width in pixels
const mapPixelHeight = 512 * 64;  // map height in pixels
const tileSize = 64;
const thickness = Math.max(tileSize, 16);

// number of cols/rows (tiles)
const cols = Math.ceil(mapPixelWidth / tileSize);
const rows = Math.ceil(mapPixelHeight / tileSize);
const tileCount = cols * rows;

// chunking config
const CHUNK_TILES = 16; // 16x16 tiles per chunk
const CHUNK_PX = CHUNK_TILES * tileSize;
const chunkCols = Math.ceil(cols / CHUNK_TILES);
const chunkRows = Math.ceil(rows / CHUNK_TILES);
const chunkCount = chunkCols * chunkRows;

// map entities / layers
const map = add([pos(0, 0), scale(1), layer("bg")]);
const mapOverlay = add([pos(0, 0), scale(1), layer("fg")]);

// store tile indices (much smaller & faster than objects)
const mapBgIdx = new Uint16Array(tileCount); // background tile index per cell
const mapFgIdx = new Uint16Array(tileCount); // foreground tile index per cell
const colliderMask = new Uint8Array(tileCount); // 1 if this cell needs a collider
const mapOverlayIdx = new Uint16Array(tileCount); // new array for overlay sprites

// chunk metadata
const chunks = Array.from({ length: chunkCount }, () => ({
  visible: false,
  bodies: [],
  lastSeen: 0,
}));

let frameCounter = 0;

function tileIndexAt(x, y) {
  return y * cols + x;
}

function chunkIndexAt(cx, cy) {
  return cy * chunkCols + cx;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

//------------------
// structure framework
//------------------
function canPlaceStructure(x, y, width, height) {
  // prevent placement outside map bounds
  if (x < 0 || y < 0 || x + width > cols || y + height > rows) return false;

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const idx = tileIndexAt(x + dx, y + dy);
      if (mapFgIdx[idx] !== 0 || mapOverlayIdx[idx] !== 0) return false;
    }
  }
  return true;
}

/**
 * pattern: 2D array of { id, layer: 'fg'|'overlay', collider:boolean } 
 */
function placeStructure(x, y, pattern) {
  for (let dy = 0; dy < pattern.length; dy++) {
    for (let dx = 0; dx < pattern[0].length; dx++) {
      const tile = pattern[dy][dx];
      if (!tile) continue;

      const idx = tileIndexAt(x + dx, y + dy);

      if (tile.layer === 'fg') {
        mapFgIdx[idx] = tile.id;
        if (tile.collider) colliderMask[idx] = 1;
      } else if (tile.layer === 'overlay') {
        mapOverlayIdx[idx] = tile.id;
      }
    }
  }
}

//------------------
// tree & bush patterns
//------------------
const treePattern = [
  [ {id:157, layer:'overlay'}, {id:158, layer:'overlay'} ],
  [ {id:174, layer:'overlay'}, {id:175, layer:'overlay'} ],
  [ {id:191, layer:'fg', collider:true}, {id:192, layer:'fg', collider:true} ]
];

const bushPattern = [
  [ {id:56, layer:'fg', collider:true} ]
];

//------------------
// helpers for random placement
//------------------
function tryPlaceTree(x, y, rng=Math.random) {
  if (rng() < 0.015 && canPlaceStructure(x, y, 2, 3)) {
    placeStructure(x, y, treePattern);
    return true;
  }
  return false;
}

function tryPlaceBush(x, y, rng=Math.random) {
  if (rng() < 0.07 && canPlaceStructure(x, y, 1, 1)) {
    placeStructure(x, y, bushPattern);
    return true;
  }
  return false;
}

// Optimized createTiles function
function createTiles() {
  // Fill background with base tiles
  mapBgIdx.fill(24); // base tile

  // Place vegetation with spacing rules
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = tileIndexAt(x, y);

      // structures
      tryPlaceTree(x, y);
      tryPlaceBush(x, y);
    }
  }

  // map boundaries - keep permanent bodies for world edges
  const boundaries = [
    { _pos: [0, -thickness], size: [mapPixelWidth, thickness] },
    { _pos: [0, mapPixelHeight], size: [mapPixelWidth, thickness] },
    { _pos: [-thickness, 0], size: [thickness, mapPixelHeight] },
    { _pos: [mapPixelWidth, 0], size: [thickness, mapPixelHeight] },
  ];

  boundaries.forEach(({ _pos, size }) => {
    map.add([
      pos(..._pos),
      area({ shape: new Rect(vec2(0), ...size) }),
      body({ isStatic: true }),
    ]);
  });
}

createTiles();

//-------------
// Chunk collider management
//-------------
function createChunkColliders(cx, cy) {
  const chunk = chunks[chunkIndexAt(cx, cy)];
  if (!chunk || chunk.visible) return;
  const startX = cx * CHUNK_TILES;
  const startY = cy * CHUNK_TILES;
  const endX = Math.min(startX + CHUNK_TILES, cols);
  const endY = Math.min(startY + CHUNK_TILES, rows);

  for (let y = startY; y < endY; y++) {
    let x = startX;
    while (x < endX) {
      const idx = tileIndexAt(x, y);
      if (colliderMask[idx]) {
        // horizontal merge within chunk bounds
        let sx = x, ex = x + 1;
        while (ex < endX && colliderMask[tileIndexAt(ex, y)]) ex++;
        const rectX = sx * tileSize;
        const rectY = y * tileSize;
        const rectW = (ex - sx) * tileSize;
        const rectH = tileSize;
        const bodyEnt = map.add([
          pos(rectX, rectY),
          area({ shape: new Rect(vec2(0), rectW, rectH) }),
          body({ isStatic: true }),
          "mapCol",
        ]);
        chunk.bodies.push(bodyEnt);
        x = ex;
      } else {
        x++;
      }
    }
  }

  chunk.visible = true;
  chunk.lastSeen = frameCounter;
}

function removeChunkColliders(cx, cy) {
  const chunk = chunks[chunkIndexAt(cx, cy)];
  if (!chunk || !chunk.visible) return;
  chunk.bodies.forEach(b => {
    try { destroy(b); } catch (e) { /* ignore if destroy not available */ }
  });
  chunk.bodies.length = 0;
  chunk.visible = false;
}

//-------------
// Visibility & drawing helpers (chunk-aware)
//-------------
let lastVisibleChunks = { minChunkX: 0, maxChunkX: 0, minChunkY: 0, maxChunkY: 0 };

function updateVisibleChunks(minTileX, maxTileX, minTileY, maxTileY) {
  if (frameCounter % 3 === 0) {
    const minChunkX = clamp(Math.floor(minTileX / CHUNK_TILES), 0, chunkCols - 1);
    const maxChunkX = clamp(Math.floor(maxTileX / CHUNK_TILES), 0, chunkCols - 1);
    const minChunkY = clamp(Math.floor(minTileY / CHUNK_TILES), 0, chunkRows - 1);
    const maxChunkY = clamp(Math.floor(maxTileY / CHUNK_TILES), 0, chunkRows - 1);

    for (let cy = 0; cy < chunkRows; cy++) {
      for (let cx = 0; cx < chunkCols; cx++) {
        const inView = (cx >= minChunkX && cx <= maxChunkX && cy >= minChunkY && cy <= maxChunkY);
        if (inView) {
          createChunkColliders(cx, cy);
        } else {
          if (chunks[chunkIndexAt(cx, cy)].visible) removeChunkColliders(cx, cy);
        }
      }
    }

  lastVisibleChunks = { minChunkX, maxChunkX, minChunkY, maxChunkY };
  }

  return lastVisibleChunks;
}