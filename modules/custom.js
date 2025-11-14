//----------
// handy dandy functions
//----------
// global trail list
let trails = [];

// createTrail(sprite, pos, scale, life, opacity, movement)
function createTrail(sprite, pos, scale = 1, life = 0.1, opacity = 0.3, movement = vec2(0, 0), anchor = "center") {
    trails.push({
        sprite,
        pos: pos.clone(),
        scale,
        life,
        opacity,
        timer: life,
        movement,
        anchor,
    });
}

// call this each frame
function updateTrails() {
    for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];

        // move it a bit
        t.pos = t.pos.add(t.movement.scale(dt()));

        // fade out
        t.timer -= dt();
        const alpha = Math.max(0, t.timer / t.life) * t.opacity;

        // draw directly
        drawSprite({
            sprite: t.sprite,
            pos: t.pos,
            scale: t.scale,
            opacity: alpha,
            anchor: t.anchor,
        });

        // remove if dead
        if (t.timer <= 0) {
            trails.splice(i, 1);
        }
    }
}

sMoveTowards = (a, b) => {};

function mulVecBy(vec, x) {
    return vec2(
        vec.x * x,
        vec.y * x
    )
}

function angleBtwn(vec0, vec1) {
    return vec1.sub(vec0).angle();
}

function radBtwn(vec0, vec1) {
    return vec1.sub(vec0).unit();
}

function vecLen(vec) {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
}

function vecNormal(vec) {
    const len = vecLen(vec);

    if (len > 0) {
        return vec2(vec.x / len, vec.y / len);
    } else {
        return vec2(1,0); // default right if no input
    }
}

function rgba(r, g, b, a) {
    return rgb(r, g, b);
}

function drawBar(_ = {
        width: 100,
        height: 20,
        x: center().x - _.w,
        y: height() - 50,
        outline: 7.5,
        bgColor: rgb(22, 22, 22),
        fgColor: rgb(244, 244, 255),
        pct: 1,
        anchor: "topleft",
        scale: 1,
    }) {

    const w = _.width ?? 100;
    const h = _.height ?? 20;
    const x = _.x ?? center().x - _.w;
    const y = _.y ?? height() - 50;
    const o = _.outline ?? 7.5;
    const c = _.bgColor ?? rgb(22, 22 ,22);
    const fC = _.fgColor ?? rgb(244, 244, 255);
    const pct = _.pct ?? "1";
    const anch = _.anchor ?? "topleft";
    const sca = _.scale ?? 1;

    // background
    drawRect({
      pos: vec2(x, y),
      width: w,
      height: h,
      color: c,
      anchor: anch,
      scale: sca,
    });

    // fill
    drawRect({
      pos: vec2(x + (o/2 * sca), y + (o/2 * sca)),
      width: (w - o) * pct,
      height: (h - o),
      color: fC,
      anchor: anch,
      scale: sca,
    });
}

// simple rectangle-based collision for dash phase-through
function rectOverlap(a, b) {
    const aw = a.width || 32;
    const ah = a.height || 32;
    const bw = b.width || 32;
    const bh = b.height || 32;

    return (
        a.pos.x < b.pos.x + bw &&
        a.pos.x + aw > b.pos.x &&
        a.pos.y < b.pos.y + bh &&
        a.pos.y + ah > b.pos.y
    );
}

// collideOnce version for phase-through
function collideOnceWith(obj, targets, callback) {
    obj._currentCollisions = obj._currentCollisions || new Set();

    get(targets).forEach(t => {
        if (t === obj) return;

        if (rectOverlap(obj, t)) {
            if (!obj._currentCollisions.has(t)) {
                obj._currentCollisions.add(t);
                callback(t);
            }
        } else {
            obj._currentCollisions.delete(t);
        }
    });
}

// repeat
function repeat(fn, times) {
    for (let i = 0; i < times; i++) {
        fn(i);
    }
}

// entity spawn
function summon(_ = () => e.virabird(), _pos_ = player.pos, i = 1, extra = [""]) {
    repeat(() => {
        add([
            ..._(),
            {
            add() {
                this.pos = _pos_;
            },
            },
            ...extra,
        ]);
    }, i)
}

//----------
// custom types
//----------

// projectiles
let p = {
    // main bullet constructor
    bullet() {
        return [
            "bullet",
            color(),
            rotate(0),
            scale(),
            area(),
            anchor("center"),
            opacity(),
            offscreen({ destroy: true, distance: 400 }),
        ]
    },
    // sock bullet
    sokBullet(angle) {
        return [
            "sokBullet",
            "playerBullet",
            sprite("sok"),
            ...p.bullet(),
            projectile(600, 3, angle, false),
            {
                update() {
                    this.rotateBy(180 * dt());
                },
            } , 
        ]
    },

    // mark's legend bullet
    bookBullet(angle) {
        return [
            "bookBullet",
            "enemyBullet",
            sprite("marks_legend"),
            ...p.bullet(),
      	    projectile(550, 3, angle, false),
      	    {
                update() {
                    this.rotateBy(180 * dt());
                },
            },
        ]
    },

    // the gigagantrum's great jam
    jamBullet(angle, c = false) {
        return [
            "jamBullet",
            "enemyBullet",
            sprite("jam"),
            ...p.bullet(),
            projectile(600, 3, angle, false),
            {
                add() {
                    if (!c) {
                    add([
                        pos(this.pos),
                        ...p.jamBullet(this.dir - 45, true),
                    ]);
                    add([
                        pos(this.pos),
                        ...p.jamBullet(this.dir + 45, true),
                    ]);
                    }
                },
                update() {
                    this.rotateBy(180 * dt());
                },
            },
        ]
    },

    // the gigagantrum's great lightning blasts
    lightningBullet(angle, c = false, shot = Math.round(Math.random() + 1)) {
        return [
            "lightningBullet",
            "enemyBullet",
            sprite("lightning"),
            ...p.bullet(),
            projectile(600, 1.5, angle + (Math.round(Math.random() * 40)) - 20, false),
            {
                update() {
                    this.rotateBy(180 * dt());
                    if (this.shot == 1) {
                        this.dir += 50 * dt();
                    } else {
                        this.dir -= 50 * dt();
                    }
                },
            },
        ]
    },

    // the gigagantrums's great flaming waves
    fireWaveBullet(angle, count = 30) {
        if (count <= 0) {
            return [
                {
                    add() {
                        destroy(this);
                    }
                }
            ];
        }

        return [
            "fireWaveBullet",
            "enemyBullet",
            sprite("fire"),
            ...p.bullet(),
            projectile(0, 0.2, angle, false),
            item(0.05),
            {
                wc: count, // store value in object

                update() {
                    if (this.cd <= 0 && this.wc > 0 && this.lifespan > 0.1) {
                        const direction = vec2(Math.cos(deg2rad(angle)), Math.sin(deg2rad(angle)));

                        add([
                            pos(this.pos.add(direction.scale(50))),
                            ...p.fireWaveBullet(angle, this.wc - 1),
                        ]);

                        this.cd = 1000;
                    }
                },
            },
        ];
    },

    virabirdBullet(angle) {
        return [
            "virabirdBullet",
            "enemyBullet",
            sprite("virabirdBullet"),
            scale(4),
            ...p.bullet(),
            projectile(600, 3, angle, false, true),
            {
                add() { this.angle = this.dir },
            } , 
        ]
    },

    gigagantrumSpawn(_pos) {
        return [
            "gigagantrumSpawn",
            sprite("virat"),
            ...p.bullet(),
            {
                add() {
                    this.hidden = true;
                },
                update() {
                    summon(() => e.virat(), this.pos);
                    summon(() => e.virabird(), this.pos);
                    destroy(this);
                }
            }
        ]
    }
};

// entities
let e = {
    enemy(col = [], tag = true) {
        return [
            (tag) ? "enemy" : "",
            pos(),
            area({ collisionIgnore: col }),
            rotate(),
            body({ drag: 0.5, maxSpeed: 200 }),
            anchor('center'),
            enemy(),
            lifespan(-1, true),
            {
                add() {
                    this.on("hurt", () => {
                        play("hit", { volume: 0.25 });
                        play("hurt", { volume: 0.25 });
                    });
                    
                    this.onDestroy(() => {
                        play("hit", { volume: 1.75 });
                        play("hurt", { volume: 1.75 });
                    });
                }
            },
        ];
    },
    skuller() {
        return [
            "skullerEnemy",
            sprite("skuller"),
            scale(),
            health(5, 5),
            ...e.enemy(["mapCol"]),
            item(Math.random() * 2),
            {
                update() {
                    rangerAi(this, player, 2, "bookBullet");
                }
            }
        ];
    },
    gigagantrum() {
        return [
            "gigagantrumEnemy",
            "boss",
            sprite("gigagantrum"),
            scale(3),
            health(50, 50),
            ...e.enemy(["mapCol","enemy"], false),
            item([3, 2, 5]),
            {
                update() {
                    // create trail
                    const inputDir = vec2(
                        (Math.round(Math.random())) - (Math.round(Math.random())),
                        (Math.round(Math.random())) - (Math.round(Math.random())),
                    );
                    createTrail(this.sprite, this.pos, this.scale ?? 1, 0.3, 1, inputDir.scale(200));
                    gigaAi(this, player, [3, 2, 5], ["jamBullet", "fireWaveBullet", "gigagantrumSpawn"]);
                }
            }
        ];
    },
    virat() {
        return [
            "viratEnemy",
            sprite("virat"),
            health(5, 5),
            ...e.enemy(["mapCol"]),
            item(Math.random() * 2),
            dash(["mapCol"], 1800, Math.random() * 5, 2, 0.2, ["mapCol", "enemy", "player"]),
            scale(1.5),
            {
                add() {},

                update() {
                    collideOnceWith(this, "player", (p) => {
                        if (!p.isDashing) p.hurt(1);
                    })

                    viratAi(this, player, null, null);
                }
            }
        ]
    },
    virabird() {
        return [
            "virabirdEnemy",
            sprite("virabird"),
            health(2, 2),
            ...e.enemy(["mapCol","enemy","player"]),
            item(Math.random() * 2),
            dash(["mapCol","enemy","player"], 750, 0, 1, 0.9, ["mapCol", "enemy", "player"]),
            scale(1),
            {
                add() {

                },
                update() {
                    /*
                    collideOnceWith(this, "player", (p) => {
                        if (!p.isDashing) this.hurt(1);
                    })
                    */

                    virabirdAi(this, player, 1, "virabirdBullet");
                }
            }
        ]
    },
}

//----------
// Custom Components & Plugins
//----------
function item(cd, mCd = []) {  
    return {
        id: "item",

        cd: cd,
        mCd: mCd,
        update() {
            if (this.cd[1]) {
                this.cd = this.cd.map(n => n - (1 * dt()));
            } else {
                this.cd -= 1 * dt();
            }
        },

        inspect() {
            return `item: ${this.cd}`;
        }
    };
}

function lifespan(lSpan, s = false) {
    return {
        id: "lifespan",
        require: [],

        lifespan: lSpan,
        sca: 1,
        add() {
            this.sca = this.scale?.x ?? 1;
        },
        update() {
            if (this.lifespan === -1) return;

            this.lifespan -= dt();

            if (this.lifespan <= 0) destroy(this);

            if (this.lifespan <= 0.1 && s === true) {
                this.opacity = this.lifespan * 10;
                this.scale = vec2(
                    this.sca + (0.5 - this.lifespan * 5 * this.sca),
                    this.sca + (0.5 - this.lifespan * 5 * this.sca)
                );
            }
        }
    }
}


function projectile(speed, lSpan, direction, col = false, sc = true) {
    return {
        id: "projectile",
        require: [ "area", "scale" ],

        speed: speed,
        dir: direction,
        col: col,
        add() {
            if (lSpan) {
                this.use(lifespan(lSpan, true))
            }
            if (this.col) {
                this.onCollide("mapCol", () => {
                    this.lifespan = 0.1;
                });
            }
        },
        update() {
            this.use(move(this.dir, this.speed));
        },
    }
}

function enemy() {
    return {
        id: "enemy",
        require: [ "health", "lifespan", "scale" ],
        
        xVel: 0,
        yVel: 0,
        add() {
          this.onCollide("playerBullet", (b) => {
              this.hurt(1);
              b.lifespan = 0.1;
          });
          this.on("death", () => {
              this.lifespan = 0.1;
              if (gameShake) shake(3);
          })
        },
        update() {
            
        },
        draw() {
          if (this.maxHP() > this.hp())
          drawBar({
              width: 40,
              height: 9,
              x: (this.scale?.x < 1.5) ? -20 * (1.5 / this.scale?.x) : -20,
              y: 0 - (this.height / 2) - 20,
              outline: 4,
              bgColor: rgb(22, 22, 22),
              fgColor: rgb(255, 115, 81),
              pct: (this.hp() / this.maxHP()),
              anchor: "topleft",
              scale: (this.scale?.x < 1.5) ? (1.5 / this.scale?.x) : 1,
          });
        },
    }
}

function dash(col = true, dSpd = 1200, dCd = 0, dMCd = 1, dDur = 0.2, dCol = ["mapCol", "enemy", "player"]) {
    return {
        id: "dash",
        require: [ "pos" ],

        isDashing: false,
        dashSpeed: dSpd,
        dashCd: dCd,
        dashMCd: dMCd,
        dashDuration: dDur,
        dashDurRmn: 0,
        dashDir: vec2(0,0),
        col: col,
        dash(x, y) {
            if (this.dashCd > 0 || this.isDashing) return;

            if (this.col) this.collisionIgnore = dCol;
            this.isDashing = true;
            this.dashCd = this.dashMCd;
            this.dashDurRmn = this.dashDuration;

            // store dash direction
            this.dashDir = vec2(x, y);
            
            this.dashDir = vecNormal(this.dashDir);
        },
        update() {
            if (this.dashCd > 0) this.dashCd -= dt();

            if (this.isDashing) {
                this.dashDurRmn -= dt();
                this.pos = this.pos.add(this.dashDir.scale(this.dashSpeed * dt()));

                // create trail
                createTrail(this.sprite, this.pos, this.scale ?? 1, 0.2, 0.3, vec2(0,0), this.anchor);

                if (this.dashDurRmn <= 0) {
                    this.isDashing = false;
                    if (this.col) this.collisionIgnore = (Array.isArray(this.col)) ? this.col : [];
                }
            }
        },
    }
}