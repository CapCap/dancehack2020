const Matter = require("matter-js");


const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  World = Matter.World,
  Bodies = Matter.Bodies;


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


const CANVAS_WIDTH = 1200.;
const CANVAS_HEIGHT = 600;

const RECT_WIDTH = 20;
const RECT_HEIGHT = 5;

let CENTER_X = CANVAS_WIDTH / 2.0;
let CENTER_Y = CANVAS_HEIGHT / 2.0;


const SPAWN_RADIUS = 200;
const SPAWN_ANGLE_INTERVAL = 10;
const SPAWN_TIMEOUT = 200;

const FAKE_PERSON = Bodies.rectangle(CENTER_X, CENTER_Y, 100, 300);


const position_log = {};

function addTile(x_spawn_f, y_spawn_f, angle_r) {
  const x_spawn = x_spawn_f();
  const y_spawn = y_spawn_f();
  const body = Bodies.rectangle(x_spawn, y_spawn, RECT_WIDTH, RECT_HEIGHT);
  Matter.Body.setAngle(body, angle_r);
  // Matter.Body.setMass(body, 0);

  body.force.x += (x_spawn - CENTER_X) / 1000000.0;
  body.force.y += (y_spawn - CENTER_Y) / 1000000.0;

  body.friction = 0;
  body.frictionAir = 0;
  body.frictionStatic = 0;
  body.slop = 0.0005;

  body.render.fillStyle = "red";

  World.add(world, [
    body
  ]);
}

function addTileEmitter(x_start_f, y_start_f, angle_r, timeout = 300) {
  setInterval(() => addTile(x_start_f, y_start_f, angle_r), timeout);
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

  console.log(`Removed ${count} entities`);
}

document.addEventListener("DOMContentLoaded", function () {

  // create renderer
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      showVelocity: true
    }
  });

  // run the engine
  Engine.run(engine);
  Render.run(render);
  Runner.run(runner, engine);

  for (let i = 0; i < 360; i += SPAWN_ANGLE_INTERVAL) {
    const angle_r = i * (Math.PI / 180);
    //const x = CENTER_X + SPAWN_RADIUS * Math.cos(angle_r);
    //const y = CENTER_Y + SPAWN_RADIUS * Math.sin(angle_r);
    addTileEmitter(
      () => (CENTER_X + SPAWN_RADIUS * Math.cos(angle_r)),
      () => (CENTER_Y + SPAWN_RADIUS * Math.sin(angle_r)),
      angle_r + Math.PI / 2,
      SPAWN_TIMEOUT);
  }

  // Remove out of bound elements every 1s
  setInterval(() => removeOutOfBoundsBodies(Matter.Composite.allBodies(world)), 300);

  setInterval(() => {
    CENTER_X = FAKE_PERSON.position.x;
    CENTER_Y = FAKE_PERSON.position.y;
  }, 10);


  const mouse = Matter.Mouse.create(render.canvas);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  });
  World.add(world, mouseConstraint);
  render.mouse = mouse;

  World.add(world, [
    FAKE_PERSON
  ]);

  Render.lookAt(render, {
    min: {x: 0, y: 0},
    max: {x: 800, y: 600}
  });


});
