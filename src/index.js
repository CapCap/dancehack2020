const Matter = require("matter-js");
const GeomUtils = require("./geom_utils.js");


const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Vector = Matter.Vector,
  Vertices = Matter.Vertices
;

const engine = Engine.create();
engine.constraintIterations = 1;
engine.positionIterations = 1;
engine.velocityIterationsNumber = 1;

const world = engine.world;
world.gravity.x = 0;
world.gravity.y = 0;

// create runner
const runner = Runner.create();
runner.delta = 100;
runner.isFixed = true;


const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;

const RECT_WIDTH = 20;
const RECT_HEIGHT = 5;

let CENTER_X = CANVAS_WIDTH / 2.0;
let CENTER_Y = CANVAS_HEIGHT / 2.0;

const SPAWN_POINT_OFFSET = 30;
const SPAWN_MAX_INTERVAL_APART = 75;
const SPAWN_INTERVAL = 200;
const SPAWN_HEIGHT_CUTOFF = CANVAS_HEIGHT - 50;
const SPAWN_MIN_LENGTH_CUTOFF = 50;

const PERSON_COLLIDER_UPDATE_INTERVAL = 500;

const DEBUG_PERSON_COLLIDER_COLOR = true;
const DEBUG_RENDER_WIREFRAME_ONLY = false;
const DEBUG_DISABLE_TILE_SPAWNING = true;
const DEBUG_DISABLE_PERSON_COLLIDER = false;

// Should the tiles collide with one another
const TILES_COLLIDE = true;


const FAKE_PERSON = Bodies.rectangle(CENTER_X, CENTER_Y, 100, 300);
FAKE_PERSON.render.fillStyle = "#4444FF";
FAKE_PERSON.collisionFilter.group = 0;
FAKE_PERSON.collisionFilter.category = 0b0001;
FAKE_PERSON.collisionFilter.mask = 0b0011;

// disables the fake person collider. Helps with debugging tile spawn locations.
if (DEBUG_DISABLE_PERSON_COLLIDER) {
  FAKE_PERSON.collisionFilter.category = 0b0;
  FAKE_PERSON.collisionFilter.mask = 0b0;
}


// TODO: THIS IS UPSIDE DOWN :-(
const CURRENT_POSE = {
  head_center: [210 * 2, CANVAS_HEIGHT - 215 * 2],
  head_radius: 30,
  head_circle: makeSkeletonCollider("head"),

  // Left side
  left_shoulder: [200 * 2, CANVAS_HEIGHT - 200 * 2],
  left_elbow: [180 * 2, CANVAS_HEIGHT - 180 * 2],
  left_hand: [175 * 2, CANVAS_HEIGHT - 160 * 2],
  left_shoulder_to_elbow_width: 10,
  left_elbow_to_hand_width: 10,
  left_shoulder_to_elbow_rect: makeSkeletonCollider("left_shoulder_to_elbow"),
  left_elbow_to_hand_rect: makeSkeletonCollider("left_elbow_to_hand"),

  left_hip: [200 * 2, CANVAS_HEIGHT - 160 * 2],
  left_knee: [200 * 2, CANVAS_HEIGHT - 130 * 2],
  left_foot: [200 * 2, CANVAS_HEIGHT - 100 * 2],
  left_hip_to_knee_width: 10,
  left_knee_to_foot_width: 10,
  left_hip_to_knee_rect: makeSkeletonCollider("left_hip_to_knee"),
  left_knee_to_foot_rect: makeSkeletonCollider("left_knee_to_foot"),

  // Right side
  right_shoulder: [220 * 2, CANVAS_HEIGHT - 200 * 2],
  right_elbow: [245 * 2, CANVAS_HEIGHT - 190 * 2],
  right_hand: [265 * 2, CANVAS_HEIGHT - 180 * 2],
  right_shoulder_to_elbow_width: 10,
  right_elbow_to_hand_width: 10,
  right_shoulder_to_elbow_rect: makeSkeletonCollider("right_shoulder_to_elbow"),
  right_elbow_to_hand_rect: makeSkeletonCollider("right_elbow_to_hand"),

  right_hip: [220 * 2, CANVAS_HEIGHT - 160 * 2],
  right_knee: [235 * 2, CANVAS_HEIGHT - 135 * 2],
  right_foot: [230 * 2, CANVAS_HEIGHT - 110 * 2],
  right_hip_to_knee_width: 10,
  right_knee_to_foot_width: 10,
  right_hip_to_knee_rect: makeSkeletonCollider("right_hip_to_knee"),
  right_knee_to_foot_rect: makeSkeletonCollider("right_knee_to_foot"),

  // Body.
  body_rect: makeSkeletonCollider("body_rect"),
};

// Set up some fake poses here for testing, woo
// TODO: actually set em up, yo

const GROUND = Bodies.rectangle(0, CANVAS_HEIGHT, CANVAS_WIDTH * 2, 10);
GROUND.collisionFilter.group = 0;
GROUND.collisionFilter.category = 0b0100;
GROUND.collisionFilter.mask = 0b0101;
Matter.Body.setStatic(GROUND, true);

function makeHead(x, y, radius) {
  const body = Bodies.circle(10, 10, 50);
  body.collisionFilter.group = 0;
  body.collisionFilter.category = 0b1000;
  body.collisionFilter.mask = 0b0001;
  body.label = "head";
  return body;
}

function makeSkeletonCollider(name) {
  const body = Bodies.rectangle(10, 10, 15, 15);
  body.collisionFilter.group = 0;
  body.collisionFilter.category = 0b1000;
  body.collisionFilter.mask = 0b0001;
  body.label = name;

  // ensure we're not pushed around by the balls
  // Matter.Body.setStatic(body, true);

  return body;
}

function addTile(x_spawn, y_spawn, angle_r, force_vector) {
  // Don't spawn too close to the ground?
  if (y_spawn > SPAWN_HEIGHT_CUTOFF) {
    return;
  }

  const body = Bodies.circle(x_spawn, y_spawn, RECT_WIDTH);
  Matter.Body.setAngle(body, angle_r);
  body.collisionFilter.group = 0;
  if (!TILES_COLLIDE) {
    body.collisionFilter.category = 0b0110;
    body.collisionFilter.mask = 0b0101;
  }

  // body.render.fillStyle = "#" + Math.floor((Math.random() * 16777215) + 1000).toString(16);

  body.force.x += force_vector[0] / 10000.0;
  body.force.y += force_vector[1] / 10000.0;

  body.friction = 0;
  body.frictionAir = 0;
  body.frictionStatic = 0;
  body.slop = 0.0005;

  World.add(world, [
    body,
  ]);
}


function removeOutOfBoundsBodies(bodies) {
  let count = 0;

  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    if (body.position.x > CANVAS_WIDTH || body.position.x < 0 || body.position.y > CANVAS_HEIGHT || body.position.y < 0) {
      World.remove(world, body);
      count++;
    }
  }

  console.log(`Removed ${count} out of bound entities`);
}

function alignRectToLine(line_pt1, line_pt2, rect, width) {
  console.log(">>", line_pt1, line_pt2)
  const midpoint = GeomUtils.getMidpoint(line_pt1, line_pt2);
  Matter.Body.setVelocity(rect, {x: 0, y: 0});
  Matter.Body.setPosition(rect, {x: midpoint[0], y: midpoint[1]});

  Matter.Body.setStatic(rect, true);
  console.log("midpoint", midpoint)
  //Matter.Body.translate(rect, [1, 1]);
  console.log(rect)
  //TODO: angles and shit
  // TODO: UPDATE THE VECTOR DIRECTLY
}

function spawnTilesAroundPolygon(polygon, distance, max_segment_length, min_segment_length) {
  const center = GeomUtils.centerOfRect(polygon);

  const perp_point_lines = GeomUtils.pointsPerpendicularToAndOutsideOfPolygon(polygon, distance, max_segment_length, min_segment_length);
  let angle_r;
  let p1;
  let p2;

  for (let perp_points of perp_point_lines) {
    if (GeomUtils.distanceBetweenPoints(perp_points[0], center) > GeomUtils.distanceBetweenPoints(perp_points[1], center)) {
      p1 = perp_points[0];
      p2 = perp_points[1];
    } else {
      p1 = perp_points[1];
      p2 = perp_points[0];
    }

    // TODO: When in a rect, for some reason the top force_vector direction is wrong.
    angle_r = GeomUtils.linePointsToRadians(p1, p2);
    const v = [p1[0] - p2[0], p1[1] - p2[1]];
    const m = GeomUtils.distanceBetweenPoints([0, 0], v);
    const force_vector = [v[0] / m, v[1] / m];
    // console.log("force_vector", v, m, force_vector);

    addTile(p1[0], p1[1], angle_r + Math.PI / 2, force_vector);
  }
}

function spawnTiles() {
  if (DEBUG_DISABLE_TILE_SPAWNING) {
    return;
  }/*
  const points = [];
  for (let i = 0; i < FAKE_PERSON.vertices.length; i++) {
    points.push([FAKE_PERSON.vertices[i].x, FAKE_PERSON.vertices[i].y]);
  }
  */

  // Spawn around the radius!
  spawnTilesAroundPolygon(points, SPAWN_POINT_OFFSET, SPAWN_MAX_INTERVAL_APART, SPAWN_MIN_LENGTH_CUTOFF);
}

function updatePersonPose(newPose) {
  CURRENT_POSE.head_center = newPose.head_center;
  CURRENT_POSE.head_radius = newPose.head_radius;

  // Left side
  CURRENT_POSE.left_shoulder = newPose.left_shoulder;
  CURRENT_POSE.left_elbow = newPose.left_elbow;
  CURRENT_POSE.left_hand = newPose.left_hand;
  CURRENT_POSE.left_shoulder_to_elbow_width = newPose.left_shoulder_to_elbow_width;
  CURRENT_POSE.left_elbow_to_hand_width = newPose.left_elbow_to_hand_width;

  CURRENT_POSE.left_hip = newPose.left_hip;
  CURRENT_POSE.left_knee = newPose.left_knee;
  CURRENT_POSE.left_foot = newPose.left_foot;
  CURRENT_POSE.left_hip_to_knee_width = newPose.left_hip_to_knee_width;
  CURRENT_POSE.left_knee_to_foot_width = newPose.left_knee_to_foot_width;

  // Right side
  CURRENT_POSE.right_shoulder = newPose.right_shoulder;
  CURRENT_POSE.right_elbow = newPose.right_elbow;
  CURRENT_POSE.right_hand = newPose.right_hand;
  CURRENT_POSE.right_shoulder_to_elbow_width = newPose.right_shoulder_to_elbow_width;
  CURRENT_POSE.right_elbow_to_hand_width = newPose.right_elbow_to_hand_width;

  CURRENT_POSE.right_hip = newPose.right_hip;
  CURRENT_POSE.right_knee = newPose.right_knee;
  CURRENT_POSE.right_foot = newPose.right_foot;
  CURRENT_POSE.right_hip_to_knee_width = newPose.right_hip_to_knee_width;
  CURRENT_POSE.right_knee_to_foot_width = newPose.right_knee_to_foot_width;
  updatePersonColliders();
}

function updateAbsoluteRectangleVertices(rect, new_vertices, center = null) {
  if (!center) {
    center = Vertices.centre(new_vertices);
  }

}

function updatePersonColliders() {
  //World.remove(world, CURRENT_POSE.head_circle);
  //CURRENT_POSE.head_circle = makeHead(CURRENT_POSE.head_center[0], CURRENT_POSE.head_center[1], CURRENT_POSE.head_radius);
  //World.add(world, [CURRENT_POSE.head_circle]);
  Matter.Body.setVelocity(CURRENT_POSE.head_circle, {x: 0, y: 0});
  Matter.Body.setPosition(CURRENT_POSE.head_circle, {x: CURRENT_POSE.head_center[0], y: CURRENT_POSE.head_center[1]});
  CURRENT_POSE.head_circle.circleRadius = CURRENT_POSE.head_radius;

  if (DEBUG_PERSON_COLLIDER_COLOR) {
    // Head is yellow
    // Elbow->Hands are blue
    // Shoulders->Elbows are green
    // Hip->Knees are red
    // Knee->Feet are white
    // Right side of body is brighter hue than left side
    // Body is pink
    CURRENT_POSE.left_shoulder_to_elbow_rect.render.fillStyle = "#009900";
    CURRENT_POSE.left_elbow_to_hand_rect.render.fillStyle = "#000099";

    CURRENT_POSE.right_shoulder_to_elbow_rect.render.fillStyle = "#00FF00";
    CURRENT_POSE.right_elbow_to_hand_rect.render.fillStyle = "#0000FF";

    CURRENT_POSE.left_hip_to_knee_rect.render.fillStyle = "#990000";
    CURRENT_POSE.left_knee_to_foot_rect.render.fillStyle = "#FF0000";

    CURRENT_POSE.right_hip_to_knee_rect.render.fillStyle = "#999999";
    CURRENT_POSE.right_knee_to_foot_rect.render.fillStyle = "#FFFFFF";

    CURRENT_POSE.head_circle.render.fillStyle = "#f1ff01";

    CURRENT_POSE.body_rect.render.fillStyle = "#ff7ee3";
  }

  alignRectToLine(CURRENT_POSE.left_shoulder, CURRENT_POSE.left_elbow, CURRENT_POSE.left_shoulder_to_elbow_rect, CURRENT_POSE.left_shoulder_to_elbow_width);
  alignRectToLine(CURRENT_POSE.left_elbow, CURRENT_POSE.left_hand, CURRENT_POSE.left_elbow_to_hand_rect, CURRENT_POSE.left_elbow_to_hand_width);

  alignRectToLine(CURRENT_POSE.right_shoulder, CURRENT_POSE.right_elbow, CURRENT_POSE.right_shoulder_to_elbow_rect, CURRENT_POSE.right_shoulder_to_elbow_width);
  alignRectToLine(CURRENT_POSE.right_elbow, CURRENT_POSE.right_hand, CURRENT_POSE.right_elbow_to_hand_rect, CURRENT_POSE.right_shoulder_to_elbow_width);

  alignRectToLine(CURRENT_POSE.left_hip, CURRENT_POSE.left_knee, CURRENT_POSE.left_hip_to_knee_rect, CURRENT_POSE.left_hip_to_knee_width);
  alignRectToLine(CURRENT_POSE.left_knee, CURRENT_POSE.left_foot, CURRENT_POSE.left_knee_to_foot_rect, CURRENT_POSE.left_knee_to_foot_width);

  alignRectToLine(CURRENT_POSE.right_hip, CURRENT_POSE.right_knee, CURRENT_POSE.right_hip_to_knee_rect, CURRENT_POSE.right_hip_to_knee_width);
  alignRectToLine(CURRENT_POSE.right_knee, CURRENT_POSE.right_foot, CURRENT_POSE.right_knee_to_foot_rect, CURRENT_POSE.right_knee_to_foot_width);

  // TODO: UPDATING THE BODY DOES NOT CURRENTLY WORK. UGH.
  // TODO: SETVERTICES MAY WANT A DELTA AROUND THE OBJECTS CENTER? DOCS ARE CONFUSING AF.
  const body_vertices = Vertices.clockwiseSort([
    Vector.create(CURRENT_POSE.left_shoulder[0], CURRENT_POSE.left_shoulder[1]),
    Vector.create(CURRENT_POSE.right_shoulder[0], CURRENT_POSE.right_shoulder[1]),
    Vector.create(CURRENT_POSE.left_hip[0], CURRENT_POSE.left_hip[1]),
    Vector.create(CURRENT_POSE.right_hip[0], CURRENT_POSE.right_hip[1]),
  ]);

  const center = Vertices.centre(body_vertices);
  //Vertices.create(body_vertices, CURRENT_POSE.body_rect);
  Matter.Body.setVertices(CURRENT_POSE.body_rect, body_vertices);
  Matter.Body.setVelocity(CURRENT_POSE.body_rect, {x: 0, y: 0});
  Matter.Body.setPosition(CURRENT_POSE.body_rect, center);

  console.log(body_vertices, CURRENT_POSE.body_rect);

}

function start() {
  // create renderer
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      showVelocity: false,
      wireframes: DEBUG_RENDER_WIREFRAME_ONLY,
    }
  });

  // run the engine
  Engine.run(engine);
  Render.run(render);
  Runner.run(runner, engine);

  //setInterval(() => updatePersonColliders(), PERSON_COLLIDER_UPDATE_INTERVAL);

  setInterval(() => spawnTiles(), SPAWN_INTERVAL);

  // Remove out of bound elements every 1s
  setInterval(() => removeOutOfBoundsBodies(Matter.Composite.allBodies(world)), 1000);

  // Ensure the fake person remains vertical
  setInterval(() => {
    CENTER_X = FAKE_PERSON.position.x;
    CENTER_Y = FAKE_PERSON.position.y;
    if (FAKE_PERSON.position.y > CANVAS_HEIGHT) {
      FAKE_PERSON.position.y = CANVAS_HEIGHT;
    }
    Matter.Body.setAngle(FAKE_PERSON, 0);
    //Matter.Body.setMass(FAKE_PERSON, 100);
  }, 10);

  const mouse = Matter.Mouse.create(render.canvas);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: true
      }
    }
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  World.add(world, [
    FAKE_PERSON,
    GROUND,
  ]);

  World.add(world, [
    CURRENT_POSE.head_circle,
    CURRENT_POSE.left_shoulder_to_elbow_rect,
    CURRENT_POSE.left_elbow_to_hand_rect,
    CURRENT_POSE.left_hip_to_knee_rect,
    CURRENT_POSE.left_knee_to_foot_rect,

    CURRENT_POSE.right_shoulder_to_elbow_rect,
    CURRENT_POSE.right_elbow_to_hand_rect,
    CURRENT_POSE.right_hip_to_knee_rect,
    CURRENT_POSE.right_knee_to_foot_rect,
  ]);

  updatePersonColliders();
}

document.addEventListener("DOMContentLoaded", start);
