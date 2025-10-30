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

player.onCollide("enemyBullet", () => {
  player.hurt(1);
})

player.on("death", () => {
  destroy(player);
  destroy(heldItem);
})

// sword updates (coolness)
heldItem.onUpdate(() => {
  heldItem.pos = player.pos.add(radBtwn(player.pos, cursor.pos).scale(40));
  heldItem.angle = angleBtwn(player.pos, cursor.pos);

  if (mouseDown && heldItem.cd <= 0) {
    heldItem.cd = 0.2;
    add([
      pos(player.pos),
      ...p.sokBullet(angleBtwn(player.pos, cursor.pos)),
    ])
  }
})

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

playerHealth.forEach((heart, i) => {
  heart.onHover(() => { heart.scale = (10 - i > player.hp()) ? vec2(0.9, 0.9) : vec2(1.1, 1.1); });
  heart.onHoverEnd(() => { heart.scale = (10 - i > player.hp()) ? vec2(0.8, 0.8) : vec2(1, 1); });
  heart.onUpdate(() => {
    heart.pos = getCamPos().sub(center()).add(vec2(width()-50-(i % 10 * 40),50+(Math.floor(i / 10) * 30)));
    j = (i < 10) ? i + 10 : i - 10;
    if (20 - j > player.hp()) {
        heart.color = BLACK;
        heart.scale = vec2(0.8, 0.8);
    }
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