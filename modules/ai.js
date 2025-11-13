// -----------------------------
// AI + Pathfinding (tile-based)
// -----------------------------

// Simple movement towards object
function moveTowards(_, obj, spd) {
	_.moveTo(obj.pos, spd);
}

// Smooth, simple movement towards object
function sMoveTowards(_, obj, acl) {
	const dir = obj.pos.sub(_.pos);
	const accel = dir.unit().scale(acl * dt())
	_.vel = _.vel.add(vec2(accel));
}

// Check distance from object
function distance(_, obj) {
	return (
		Math.hypot(_.pos.x - obj.pos.x, _.pos.y - obj.pos.y)
	)
}

// shooting bullet
function shootBullet(_, player, prCd, prType) {
	if (Array.isArray(_.cd)) {
		_.cd.forEach((elem, i) => {	
			if (_.cd[i] <= 0) {
				_.cd[i] = prCd[i];
				add([
					pos(_.pos),
					{
						_pos: _.pos,
					},
					...p[prType[i]](angleBtwn(_.pos, player.pos)),
				])
			}
		});
	} else {
		if (_.cd <= 0) {
		_.cd = prCd;
		add([
			pos(_.pos),
			...p[prType](angleBtwn(_.pos, player.pos)),
		])
		}
	}
}

// ranger ai
function rangerAi(_, player, prCd, prType) {
	if (distance(_, player) <= 625) {
    	sMoveTowards(_, player, -150);
  	} else if (distance(_, player) >= 635) {
    	sMoveTowards(_, player, 200);
  	}

  	shootBullet(_, player, prCd, prType);
}

// giga ai
function gigaAi(_, player, prCd, prType) {
    sMoveTowards(_, player, 100);
	shootBullet(_, player, prCd, prType);
}	

// virat ai
function viratAi(_, player, prCd, prType) {
	if (distance(_, player) <= 200) {
    	sMoveTowards(_, player, -400);
  	} else if (distance(_, player) >= 205) {
    	sMoveTowards(_, player, 200);
  	}
	sMoveTowards(_, player, 200);
	const inputDir = radBtwn(_.pos, player.pos);
    _.dash(inputDir.x, inputDir.y);
}

function virabirdAi(_, player, prCd, prType) {
	if (distance(_, player) <= 200) {
    	sMoveTowards(_, player, -1000);
  	} else if (distance(_, player) >= 300) {
    	sMoveTowards(_, player, 1500);
  	}

  	shootBullet(_, player, prCd, prType);

	const inputDir = vec2(
        (Math.round(Math.random())) - (Math.round(Math.random())),
        (Math.round(Math.random())) - (Math.round(Math.random())),
    );
    _.dash(inputDir.x, inputDir.y);
}