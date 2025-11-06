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

function dash(vec1) {
    
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
    enemy() {
        return [
            "enemy",
            scale(),
            pos(player.pos),
            area(),
            rotate(),
            body({ drag: 0.5, maxSpeed: 200 }),
            anchor('center'),
            enemy(),
        ];
    },
    skuller() {
        return [
            "skullerEnemy",
            sprite("skuller"),
            ...e.enemy(),
            item(Math.random() * 2),
            health(5),
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
            ...e.enemy(),
            item([3, 2]),
            health(30),
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
function item(cd) {  
    return {
        id: "item",

        cd: cd,
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
            this.lifespan -= 1 * dt();

            if (this.lifespan <= 0) {
                destroy(this);
            } else if (this.lifespan <= 0.1) {
                this.opacity = this.lifespan * 10;
                this.scale = vec2(1 + (0.5 - this.lifespan * 5), 1 + (0.5 - this.lifespan * 5));
            }
        },
    }
}

function enemy() {
    return {
        id: "enemy",
        require: [],
        
        xVel: 0,
        yVel: 0,
        add() {
          this.onCollide("playerBullet", (b) => {
              this.hurt(1);
              b.lifespan = 0.1;
          });
          this.on("death", () => {
              destroy(this);
          })
        },
        update() {
            
        },
    }
}