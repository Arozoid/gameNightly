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
function item(time) {  
    return {
        id: "item",

        time: time,
        update() {
            this.time -= 1 * dt();
        },
    };
}

function projectile(speed, lifespan, direction) {
    return {
        id: "projectile",

        lifespan: lifespan,
        speed: speed,
        dir: direction,
        update() {
            this.lifespan -= 1 * dt();
            this.use(move(this.dir, this.speed));

            if (this.lifespan <= 0) {
                destroy(this);
            }
        },
    }
}