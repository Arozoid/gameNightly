//-------------
// Input & updates
//-------------
player.onUpdate(() => {
  const inputX = (isKeyDown("d") ? 1 : 0) - (isKeyDown("a") ? 1 : 0);
  const inputY = (isKeyDown("s") ? 1 : 0) - (isKeyDown("w") ? 1 : 0);
  xVel += inputX * player_speed;
  yVel += inputY * player_speed;
  const targetVel = vec2(xVel, yVel);
  xVel *= friction;
  yVel *= friction;
  player.vel = targetVel;
  setCamPos(getCamPos().lerp(player.pos, 0.12));

  const cam = getCamPos();
  setCamPos(vec2(
    Math.floor(cam.x),
    Math.floor(cam.y)
  ));
});

// sword updates (coolness)
heldItem.onUpdate(() => {
  heldItem.pos = player.pos.add(radBtwn(player.pos, cursor.pos).scale(40));
  heldItem.angle = angleBtwn(player.pos, cursor.pos);

  if (mouseDown && heldItem.time <= 0) {
    heldItem.time = 0.2;
    add([
      pos(player.pos),
      sprite("sok"),
      color(),
      rotate(0),
      area(),
      anchor("center"),
      projectile(400, 3, angleBtwn(player.pos, cursor.pos)),
      "sokBullet",
      {
        update() {
          this.rotateBy(180 * dt());
        }
      }
    ])
  }
})

// glady updates (basic ranger ai)
glady.onUpdate(() => {
  if (distance(glady, player) <= height() / 2) {
    sMoveTowards(glady, player, -150);
  } else if (distance(glady, player) >= (height() / 2) + 10) {
    sMoveTowards(glady, player, 200);
  }
});

cursor.onUpdate(() => {
  cursor.pos = getCamPos().sub(center()).add(mousePos());
});

toolbox.onHover(() => { toolboxScale = true; });
toolbox.onHoverEnd(() => { toolboxScale = false; });
toolbox.onMouseDown(() => { inventoryToggle = !inventoryToggle; });
toolbox.onUpdate(() => {
  toolbox.pos = getCamPos().sub(center()).add(vec2(50, 45));
  toolbox.scale = toolboxScale ? vec2(1.1, 1.1) : vec2(1, 1);
});

hotbarItems.forEach((item, i) => {
  item.onHover(() => { item.scale = vec2(3.5, 3.5); });
  item.onHoverEnd(() => { item.scale = vec2(3.33, 3.33); });
  item.onUpdate(() => {
    item.pos = getCamPos().sub(center()).add(vec2(125 + (i * 75), 50));
  });
});

menu.onHover(() => { menuScale = true; });
menu.onHoverEnd(() => { menuScale = false; });
menu.onMouseDown(() => { menuToggle = !menuToggle; });
menu.onUpdate(() => {
  menu.pos = getCamPos().add(center()).sub(vec2(50, 45));
  menu.scale = menuScale ? vec2(1.1, 1.1) : vec2(1, 1);
})

// Non-specific updates

// Global updates
onUpdate(() => {})

let mouseDown = false;
onMousePress(() => {
  mouseDown = true;
})

onMouseRelease(() => {
  mouseDown = false;
})