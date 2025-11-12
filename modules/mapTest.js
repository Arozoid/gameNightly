// map.js - fully procedural streaming version with BG + safe colliders + structure framework
const mapPixelWidth = 512 * 64;   // map width in pixels
const mapPixelHeight = 512 * 64;  // map height in pixels

const tileSize = 64;
const CHUNK_TILES = 16;
const CHUNK_PX = CHUNK_TILES * tileSize;

const cols = Math.ceil(mapPixelWidth / tileSize);
const rows = Math.ceil(mapPixelHeight / tileSize);
const tileCount = cols * rows;

const map = add([pos(0,0), scale(1), layer("bg")]);
const mapOverlay = add([pos(0,0), scale(1), layer("fg")]);

const chunks = {}; // key = `${cx},${cy}` -> { bg, fg, overlay, colliders, bodies, visible, lastSeen }
let frameCounter = 0;
let visibleChunksCache = null;

//------------------
// helpers
//------------------
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function tileIndexInChunk(x,y){return y*CHUNK_TILES+x;}
function seededRandom(seed){return ()=>{seed=(seed*9301+49297)%233280; return seed/233280;}}

// iterate over non-zero tiles
function forEachNonZeroTile(arr, fn){
    for(let y=0;y<CHUNK_TILES;y++){
        for(let x=0;x<CHUNK_TILES;x++){
            const idx=tileIndexInChunk(x,y);
            if(arr[idx]!==0) fn(x,y,idx);
        }
    }
}

//------------------
// structure framework
//------------------
function canPlaceStructure(x,y,w,h,fg,overlay){
    if(x<0||y<0||x+w>CHUNK_TILES||y+h>CHUNK_TILES) return false;
    for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
        const idx=tileIndexInChunk(x+dx,y+dy);
        if(fg[idx]!==0||overlay[idx]!==0) return false;
    }
    return true;
}

function placeStructure(x,y,pattern,fg,overlay,colliders){
    for(let dy=0;dy<pattern.length;dy++){
        for(let dx=0;dx<pattern[0].length;dx++){
            const tidx = tileIndexInChunk(x+dx,y+dy);
            const tile = pattern[dy][dx];
            if(!tile) continue;
            if(tile.layer==='fg'){fg[tidx]=tile.id; if(tile.collider) colliders[tidx]=1;}
            else if(tile.layer==='overlay'){overlay[tidx]=tile.id;}
        }
    }
}

// tree
const treePattern=[
    [ {id:157, layer:'overlay'}, {id:158, layer:'overlay'} ],
    [ {id:174, layer:'overlay'}, {id:175, layer:'overlay'} ],
    [ {id:191, layer:'fg', collider:true}, {id:192, layer:'fg', collider:true} ]
];
function tryPlaceTree(x,y,fg,overlay,colliders,rng){
    if(rng()<0.015 && canPlaceStructure(x,y,2,3,fg,overlay)) placeStructure(x,y,treePattern,fg,overlay,colliders);
}

// bush
const bushPattern=[[ {id:56, layer:'fg', collider:true} ]];
function tryPlaceBush(x,y,fg,overlay,colliders,rng){
    if(rng()<0.07 && canPlaceStructure(x,y,1,1,fg,overlay)) placeStructure(x,y,bushPattern,fg,overlay,colliders);
}

//------------------
// chunk generation
//------------------
function generateChunk(cx,cy){
    const seed = cx*100000+cy;
    const rng = seededRandom(seed);

    const bg = new Uint16Array(CHUNK_TILES*CHUNK_TILES);
    const fg = new Uint16Array(CHUNK_TILES*CHUNK_TILES);
    const overlay = new Uint16Array(CHUNK_TILES*CHUNK_TILES);
    const colliders = new Uint8Array(CHUNK_TILES*CHUNK_TILES);

    bg.fill(24);

    for(let y=0;y<CHUNK_TILES;y++){
        for(let x=0;x<CHUNK_TILES;x++){
            tryPlaceTree(x,y,fg,overlay,colliders,rng);
            tryPlaceBush(x,y,fg,overlay,colliders,rng);
        }
    }

    return {bg,fg,overlay,colliders,bodies:[],visible:false,lastSeen:0};
}

//------------------
// chunk colliders
//------------------
function createChunkColliders(cx,cy,chunk){
    if(!chunk||chunk.visible) return;
    for(let y=0;y<CHUNK_TILES;y++){
        let x=0;
        while(x<CHUNK_TILES){
            const idx = tileIndexInChunk(x,y);
            if(chunk.colliders[idx]){
                let sx=x, ex=x+1;
                while(ex<CHUNK_TILES && chunk.colliders[tileIndexInChunk(ex,y)]) ex++;
                const rectX=(cx*CHUNK_TILES+sx)*tileSize;
                const rectY=(cy*CHUNK_TILES+y)*tileSize;
                const rectW=(ex-sx)*tileSize;
                const rectH=tileSize;
                const bodyEnt = map.add([
                    pos(rectX,rectY),
                    area({shape:new Rect(vec2(0),rectW,rectH)}),
                    body({isStatic:true}),
                    "mapCol",
                ]);
                chunk.bodies.push(bodyEnt);
                x=ex;
            }else x++;
        }
    }
    chunk.visible=true;
    chunk.lastSeen=frameCounter;
}

function removeChunkColliders(cx,cy,chunk){
    if(!chunk||!chunk.visible) return;
    chunk.bodies.forEach(b=>{try{destroy(b);}catch{}});
    chunk.bodies.length=0;
    chunk.visible=false;
}

//------------------
// visible chunks
//------------------
function updateVisibleChunks(minTileX,maxTileX,minTileY,maxTileY){
    const minChunkX = Math.floor(minTileX/CHUNK_TILES);
    const maxChunkX = Math.floor(maxTileX/CHUNK_TILES);
    const minChunkY = Math.floor(minTileY/CHUNK_TILES);
    const maxChunkY = Math.floor(maxTileY/CHUNK_TILES);

    const inViewChunks={};

    for(let cy=minChunkY;cy<=maxChunkY;cy++){
        for(let cx=minChunkX;cx<=maxChunkX;cx++){
            const key=`${cx},${cy}`;
            let chunk = chunks[key];
            if(!chunk){ chunk=generateChunk(cx,cy); chunks[key]=chunk; }
            createChunkColliders(cx,cy,chunk);
            inViewChunks[key]=true;
        }
    }

    // unload chunks out of view
    for(let key in chunks){
        if(!inViewChunks[key]){
            const chunk = chunks[key];
            removeChunkColliders(...key.split(',').map(Number),chunk);
        }
    }

    return {minChunkX,maxChunkX,minChunkY,maxChunkY};
}

//------------------
// update per frame
//------------------
onUpdate(()=>{
    frameCounter++;
    const cam = getCamPos();
    const halfW = width()/2, halfH = height()/2;
    const minTileX=Math.floor((cam.x-halfW)/tileSize);
    const maxTileX=Math.floor((cam.x+halfW)/tileSize);
    const minTileY=Math.floor((cam.y-halfH)/tileSize);
    const maxTileY=Math.floor((cam.y+halfH)/tileSize);
    visibleChunksCache = updateVisibleChunks(minTileX,maxTileX,minTileY,maxTileY);
});

//------------------
// draw loops
//------------------
map.onDraw(()=>{
    if(!visibleChunksCache) return;
    const {minChunkX,maxChunkX,minChunkY,maxChunkY} = visibleChunksCache;
    for(let cy=minChunkY;cy<=maxChunkY;cy++){
        for(let cx=minChunkX;cx<=maxChunkX;cx++){
            const chunk = chunks[`${cx},${cy}`];
            if(!chunk) continue;
            forEachNonZeroTile(chunk.bg,(x,y,idx)=>{
                drawSprite({sprite:`tile-${chunk.bg[idx]}`, pos:vec2((cx*CHUNK_TILES+x)*tileSize,(cy*CHUNK_TILES+y)*tileSize), scale:4});
            });
            forEachNonZeroTile(chunk.fg,(x,y,idx)=>{
                drawSprite({sprite:`tile-${chunk.fg[idx]}`, pos:vec2((cx*CHUNK_TILES+x)*tileSize,(cy*CHUNK_TILES+y)*tileSize), scale:4});
            });
        }
    }
});

mapOverlay.onDraw(()=>{
    if(!visibleChunksCache) return;
    const {minChunkX,maxChunkX,minChunkY,maxChunkY} = visibleChunksCache;
    for(let cy=minChunkY;cy<=maxChunkY;cy++){
        for(let cx=minChunkX;cx<=maxChunkX;cx++){
            const chunk = chunks[`${cx},${cy}`];
            if(!chunk||!chunk.overlay) continue;
            forEachNonZeroTile(chunk.overlay,(x,y,idx)=>{
                drawSprite({sprite:`tile-${chunk.overlay[idx]}`, pos:vec2((cx*CHUNK_TILES+x)*tileSize,(cy*CHUNK_TILES+y)*tileSize), scale:4});
            });
        }
    }
});