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