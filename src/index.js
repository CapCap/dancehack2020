const Matter = require("matter-js");


const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  World = Matter.World,
  Bodies = Matter.Bodies;


const engine = Engine.create();
engine.constraintIterations = 1;

const world = engine.world;
world.gravity.x = 0;
world.gravity.y = 0;

// create runner
const runner = Runner.create();
runner.delta = 100;
runner.isFixed = true;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const RECT_WIDTH = 20;
const RECT_HEIGHT = 5;

const position_log = {};

function addTile(x_start, y_start, angle) {
  const body = Bodies.rectangle(x_start, y_start, RECT_WIDTH, RECT_HEIGHT);
  Matter.Body.setAngle(body, angle);
  Matter.Body.setAngularVelocity(body, 0.001);
  console.log(angle)
  body.friction = 0;
  //body.velocity = 0.000000000000001;
  body.frictionAir = 0;
  body.frictionStatic = 0;
  body.slop = 0.005;
  //body.velocity = 0.00000001;
  World.add(world, [
    body
  ]);
}

function addTileEmitter(x_start, y_start, angle, timeout = 300) {
  //addTile(x_start, y_start, angle)
  setInterval(() => addTile(x_start, y_start, angle), timeout);
}

function removeOutOfBoundsBodies(bodies) {
  let count = 0;

  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    /*
    if (body.collisionFilter.mask != 0) {
      if (!position_log[body.id]) {
        position_log[body.id] = []
      }
      position_log[body.id].push([body.position.x, body.position.y]);

      if (position_log[body.id].length > 1) {
        const positions = position_log[body.id];
        const diff_x = positions[0][0] - positions[1][0];
        const diff_y = positions[0][1] - positions[1][1];
        //console.log(body)
        //body.force = {x: diff_x / 10.0, y: diff_y / 10.0};
        //exit(1)

        //body.collisionFilter.mask = 0;
      }

    }
    */

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
      // showVelocity: true
    }
  });

  // run the engine
  Engine.run(engine);

  Render.run(render);

  Runner.run(runner, engine);

  const spawn_x = CANVAS_WIDTH / 2;
  const spawn_y = CANVAS_HEIGHT / 2;
  const radius = 100;
  for (let i = 0; i < 180; i += 30) {
    const angle_r = i * (Math.PI / 180);
    const x = spawn_x + radius * Math.cos(angle_r);
    const y = spawn_y + radius * Math.sin(angle_r);
    addTileEmitter(x, y, i, 1000);
  }

  // Remove out of bound elements every 1s
  setInterval(() => removeOutOfBoundsBodies(Matter.Composite.allBodies(world)), 300);

  Render.lookAt(render, {
    min: {x: 0, y: 0},
    max: {x: 800, y: 600}
  });

  console.log("wut")

});
