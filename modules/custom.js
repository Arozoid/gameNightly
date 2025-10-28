//----------
// handy dandy functions
//----------
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

//----------
// Custom Components & Plugins
//----------
function item(cd) {  
    return {
        id: "item",

        cd: cd,
        update() {
            this.cd -= 1 * dt();
        },
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
            this.use(move(this.dir, this.speed));
            this.onCollide("mapCol", () => {
                this.lifespan = 0.1;
            });
        },
        update() {
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