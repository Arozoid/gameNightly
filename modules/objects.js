//-------------
// Objects & UI
//-------------
// the chosen bean. (alan becker reference??)
const player = add([
  sprite("bean"),
  pos(vec2(mapPixelWidth / 2, mapPixelHeight / 2)),
  color(),
  rotate(0),
  area(),
  body(),
  anchor("center"),
  health(20),
]);
setCamPos(player.pos);

// those one guys (thatoneguy AND battle cats reference??)
for (let i = 0; i < 5; i++) {
  add([
    ...e.skuller(),
    {
      add() {
        this.move(vec2((Math.random() * 2500), (Math.random() * 2500)))
      },
    },
  ]);
}

for (let i = 0; i < 2; i++) {
  add([
    ...e.gigagantrum(),
    {
      add() {
        this.move(vec2((Math.random() * 1000), (Math.random() * 1000)))
      },
    },
  ]);
}

// the chosen bean's blade. (alan becker reference??)
const heldItem = add([
  sprite("sok"),
  pos(player.pos.add(vec2(50,0))),
  color(),
  rotate(0),
  area(),
  anchor("center"),
  item(0.2),
])

// the mouse himself (alan becker reference??)
const cursor = add([
  sprite("cursor"),
  pos(mousePos()),
  layer("cur"),
  scale(1),
]);

cursor.hidden = true;

// hotbar from terraria (terraria reference??)
loadSprite("hotbar-slot", "./assets/ui/hotbar-slot.png");
const hotbarItems = Array.from({ length: 5 }, (_, i) => add([
  sprite("hotbar-slot"),
  pos(50, 50),
  layer("ui"),
  scale(3.33),
  area(),
  anchor("center"),
  opacity(0.7),
]));

// player health from terraria (terraria reference??)
const playerHealth = Array.from({ length: 20 }, (_, i) => add([
  sprite("heart-o"),
  pos(width() - 50, 50),
  layer("ui"),
  scale(),
  area(),
  anchor("center"),
  color(),
]));

// toolbox icon
const toolbox = add([
  sprite("toolbox-o"),
  pos(getCamPos().sub(center()).add(vec2(50, 45))),
  layer("ui"),
  scale(1),
  area(),
  anchor("center")
]);

// menu icon
const menu = add([
  sprite("menu-o"),
  pos(getCamPos().add(center()).sub(vec2(50, 45))),
  layer("ui"),
  scale(1),
  area(),
  anchor("center")
]);

// movement
const player_speed = 100;
const friction = 0.7;
let xVel = 0;
let yVel = 0;

// inventory
let hotbar = new Array(5).fill(0);
let inventoryToggle = false;
let toolboxScale = false;

// menu
let menuToggle = false;
let menuScale = false;
