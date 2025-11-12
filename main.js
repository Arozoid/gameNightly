// main.js
// Main javascript workflow for Cropbots (optimized tiling & draw)

function loadScripts(scripts, callback) {
    let i = 0;
    function next() {
        if (i >= scripts.length) return callback && callback();
        const s = document.createElement("script");

        s.src = scripts[i] + '?v=' + Date.now();

        s.onload = () => {
            console.log("Loaded:", scripts[i]);
            i++;
            next();
        }
        s.onerror = (e) => console.error("Failed:", scripts[i], e);
        document.head.appendChild(s);
    }
    next();
}


//-------------
// Imports
//-------------
import { kaplay } from "./modules/imports/kaplay.js";
import { crew } from "./modules/imports/crew.js";
import { createClient } from "./modules/imports/supabase.js";

//-------------
// Constants
//-------------

// cropbot version
const VERSION = "nightly20251110";
console.log("Cropbots version:", VERSION);

//-------------
// VM Worker
//-------------
const worker = new Worker("workers/vm-worker.js");

worker.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === "log") console.log("Worker log:", ...data);
  else if (type === "result") console.log("Worker result:", data);
  else if (type === "error") console.error("Worker error:", data);
};

function vm_run(code) {
  worker.postMessage({ code });
}

//-------------
// Kaplay init
//-------------
// get current URL
const urlParams = new URLSearchParams(window.location.search);

// get the scale
const s = (urlParams.get("scale")) ? urlParams.get("scale") : 1;
console.log("game scale: " + s);

kaplay({
  loadingScreen: false,
  plugins: [crew],
  font: "happy-o",
  debugKey: "r",
  scale: s,
});

setLayers(["bg","obj","fg","ui","load","cur"], "obj");
//setCursor("none");
setBackground("1a1a1a");

//-------------
// Sprites & tiles
//-------------
loadBean();
loadCrew("font","happy-o");
loadCrew("sprite", "cursor");
loadCrew("sprite", "knock");
loadCrew("sprite", "glady");
loadCrew("sprite", "toolbox-o");
loadCrew("sprite", "menu-o");
loadCrew("sprite", "sword");
loadCrew("sprite", "sok");
loadCrew("sprite", "beenking");
loadCrew("sprite", "marks_legend");
loadCrew("sprite", "skuller");
loadCrew("sprite", "gigagantrum");
loadCrew("sprite", "jam");
loadCrew("sprite", "config");
loadCrew("sprite", "lightning");
loadCrew("sprite", "fire");

loadSprite("heart-o", "assets/ui/heart.png");
loadSprite("heart-empty-o", "assets/ui/heart-empty.png");

loadSprite("player01", "assets/objects/player01.png");
loadSprite("player02", "assets/objects/player02.png");
loadSprite("virat", "assets/objects/virat.png");

loadSpriteAtlas("assets/tileset.png", "assets/tileset.json");
loadSprite("chunk-24", "assets/chunk-24.png");
loadSprite("loading", "assets/loading.png")

//-------------
// Load all modules
//-------------
// loading screen :>
var loadingRect = add([
    pos(0,0),
    rect(width() * 3, height() * 3),
    color("#161616"),
    layer("load"),
])

var loadingBean = add([
    pos(center()),
    anchor("center"),
    sprite("loading"),
    color(),
    rotate(),
    layer("load"),
    scale(.125),
])

var loadingText = add([
    pos(center().add(vec2(0, 200))),
    text("loading...", {
        size: 30,
        width: 500,
        font: "happy-o",
    }),
    color(),
    layer("load"),
    scale(),
])

loadingBean.onUpdate(() => {
    loadingBean.rotateBy(45 * dt());
    loadingBean.pos = getCamPos();
})

loadingRect.onUpdate(() => {
    loadingRect.pos = getCamPos().sub(center());
})

loadingText.onUpdate(() => {
    loadingText.pos = getCamPos().add(vec2(-3.75*30, 50));
})

onLoading((pct) => {
    loadingBean.rotateBy(45 * dt());
    loadingBean.pos = getCamPos();

    loadingRect.pos = getCamPos().sub(center());

    loadingText.pos = getCamPos().add(vec2(-3.75*30, 50));
})

console.log("loading..")

loadScripts([
    // Settings initialization
    "modules/load.js",
    // Custom Components & Plugins
    "modules/custom.js",
    // AI + Pathfinding (tile-based)
    "modules/ai.js",
    // Map (optimized, chunked)
    "modules/map.js",
    // Objects & UI
    "modules/objects.js",
    // Inputs & updates
    "modules/updates.js",
    // Draw loop (chunk-aware, only draw visible chunks)
    "modules/draw.js",
], 

() => {
    console.log("scripts loaded!");
    setTimeout(() => {
        destroy(loadingBean);
        destroy(loadingText);
        destroy(loadingRect);
        console.log("i cast fireball! extremely effective. loading screen destroyed")
    }, 100)
});