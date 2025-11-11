//-------------
// Input & updates
//-------------

player.onUpdate(() => {
    const inputDir = vec2(
        (isKeyDown("d") ? 1 : 0) - (isKeyDown("a") ? 1 : 0),
        (isKeyDown("s") ? 1 : 0) - (isKeyDown("w") ? 1 : 0)
    );

    // dash
    if (isKeyDown("space")) {
        player.dash(inputDir.x, inputDir.y);
    }

    // only apply normal input velocity if NOT dashing
    if (!player.isDashing) {
        xVel += inputDir.x * player_speed;
        yVel += inputDir.y * player_speed;

        const targetVel = vec2(xVel, yVel);
        xVel *= friction;
        yVel *= friction;
        player.vel = targetVel;
    } else {
        // zero out normal vel to avoid conflict
        player.vel = vec2(0,0);
    }

    setCamPos(getCamPos().lerp(player.pos, 0.12));

    const cam = getCamPos();
    setCamPos(vec2(
        Math.floor(cam.x),
        Math.floor(cam.y)
    ));
});

player.onCollide("enemyBullet", () => {
  if (!player.isDashing) player.hurt(1);
})

player.on("death", () => {
  player.lifespan = 0.1;
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

const heartsPerRow = 10;
const heartSpacingX = 40;
const heartSpacingY = 30;
const offsetX = width() - 50;
const offsetY = 50; // bottom of first row

const totalRows = Math.ceil(playerHealth.length / heartsPerRow);

/*
for (let i = playerHealth.length - 1; i >= 0; i--) { // reverse!
    const heart = playerHealth[i];
    const flippedIndex = playerHealth.length - 1 - i; // for hp logic

    heart.onHover(() => {
        heart.scale = (flippedIndex >= player.hp()) ? vec2(0.9, 0.9) : vec2(1.1, 1.1);
    });

    heart.onHoverEnd(() => {
        heart.scale = (flippedIndex >= player.hp()) ? vec2(0.8, 0.8) : vec2(1, 1);
    });

    heart.onUpdate(() => {
        const row = Math.floor(i / heartsPerRow);
        const col = i % heartsPerRow;

        const posY = offsetY + (totalRows - 1 - row) * heartSpacingY;

        heart.pos = getCamPos()
            .sub(center())
            .add(vec2(
                offsetX - col * heartSpacingX,
                posY
            ));

        if (flippedIndex >= player.hp()) {
            heart.color = BLACK;
            heart.scale = vec2(0.8, 0.8);
        }
    });
}
*/

menu.onHover(() => { menuScale = true; });
menu.onHoverEnd(() => { menuScale = false; });
menu.onMouseDown(() => { menuToggle = !menuToggle; });
menu.onUpdate(() => {
  menu.pos = getCamPos().add(center()).sub(vec2(50, 45));
  menu.scale = menuScale ? vec2(1.1, 1.1) : vec2(1, 1);
})

// Bars (item cooldown, dash, etc.)
bars.onUpdate(() => { bars.pos = getCamPos().sub(center()); });

// Global updates
onUpdate(() => {})

let mouseDown = false;
onMousePress(() => {
  mouseDown = true;
})

onMouseRelease(() => {
  mouseDown = false;
})