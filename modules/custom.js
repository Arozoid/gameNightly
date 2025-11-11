//----------
// handy dandy functions
//----------
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
        pct: 0,
    }) {

    const w = _.width;
    const h = _.height;
    const x = _.x;
    const y = _.y;
    const o = _.outline;
    const c = _.bgColor;
    const fC = _.fgColor;
    const pct = _.pct;

    // background
    drawRect({
      pos: vec2(x, y),
      width: w,
      height: h,
      color: c,
    });

    // fill
    drawRect({
      pos: vec2(x + o/2, y + o/2),
      width: (w - o) * pct,
      height: (h - o),
      color: fC,
    });
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
            {
                onExitScreen() {
                    destroy(this);
                }
            }   
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
};

// entities
let e = {
    enemy(col = []) {
        return [
            "enemy",
            scale(),
            pos(player.pos),
            area({ collisionIgnore: col }),
            rotate(),
            body({ drag: 0.5, maxSpeed: 200 }),
            anchor('center'),
            enemy(),
            lifespan(-1, true),
        ];
    },
    skuller() {
        return [
            "skullerEnemy",
            sprite("skuller"),
            health(5),
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
            sprite("gigagantrum"),
            health(30),
            ...e.enemy(["mapCol"]),
            item([3, 2]),
            {
                update() {
                    gigaAi(this, player, [3, 2], ["jamBullet", "fireWaveBullet"]);
                }
            }
        ];
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

function lifespan(lifespan, s = false) {
    return {
        id: "lifespan",
        require: [],

        lifespan: lifespan,
        update() {
            if (this.lifespan === -1) return;

            this.lifespan -= dt();

            if (this.lifespan <= 0) destroy(this);

            if (this.lifespan <= 0.1 && s) {
                this.opacity = this.lifespan * 10;
                this.scale = vec2(1 + (0.5 - this.lifespan * 5), 1 + (0.5 - this.lifespan * 5));
            }
        }
    }
}

function projectile(speed, lifespan, direction, col) {
    return {
        id: "projectile",
        require: [ "area", "scale" ],

        lifespan: lifespan,
        speed: speed,
        dir: direction,
        col: col,
        add() {
            if (this.col) {
                this.onCollide("mapCol", () => {
                    this.lifespan = 0.1;
                });
            }
        },
        update() {
            this.use(move(this.dir, this.speed));
            this.lifespan -= dt();

            if (this.lifespan <= 0) destroy(this);
            
            if (this.lifespan <= 0.1) {
                this.opacity = this.lifespan * 10;
                this.scale = vec2(1 + (0.5 - this.lifespan * 5), 1 + (0.5 - this.lifespan * 5));
            }
        },
    }
}

function enemy() {
    return {
        id: "enemy",
        require: [ "health", "lifespan" ],
        
        xVel: 0,
        yVel: 0,
        add() {
          this.onCollide("playerBullet", (b) => {
              this.hurt(1);
              b.lifespan = 0.1;
          });
          this.on("death", () => {
              this.lifespan = 0.1;
          })
        },
        update() {
            
        },
    }
}

function dash(col = true, dSpd = 1200, dCd = 0, dMCd = 1, dDur = 0.2) {
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

            if (this.col) this.use(area({collisionIgnore: ["mapCol"]}));
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
                add([
                    pos(this.pos),
                    anchor("center"),
                    sprite(this.sprite),
                    opacity(0.3),
                    lifespan(0.1) // fades quickly
                ]);

                if (this.dashDurRmn <= 0) {
                    this.isDashing = false;
                    if (this.col) this.use(area());
                }
            }
        },
    }
}