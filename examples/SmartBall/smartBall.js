function Jump() {
    this.x = 0;
    this.y = 0;

    this.randomize = function() {
        let power = Math.random() * 0.005;
        let angle = Math.random() * Math.PI + Math.PI;
        this.x = Math.cos(angle) * power;
        this.y = Math.sin(angle) * power;
    };

    this.randomize();
}

function Ball(body) {
    this.body = body;
    this.done = false;
    this.counter = 0;
    this.jumps = [];
    // initialize jump genome
    for(var i = 0; i < 20; i++) {
        this.jumps.push(new Jump());
    }

    this.isMoving = function() {
        return Math.round(this.body.speed) != 0 || Math.round(this.body.angularVelocity) != 0;
    }

    // update
    this.update = function() {
        //console.log(this.counter);
        if(!this.isMoving()) {
            if (this.counter < 20) {
                let jump = this.jumps[this.counter++];
                this.body.force = {x: jump.x, y: jump.y};
            } 
            else {
                this.done = true;
            }
        }
    }
}


window.onload = function() {
    // module aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies;
        Events = Matter.Events;

    // create an engine
    var engine = Engine.create();

    // create a renderer
    var render = Render.create({
        element: document.body,
        engine: engine
    });

    var population = [];
    // generate the population 
    for (var i = 0; i < 50; i++) {
        let body = Bodies.circle(400, 560, 5, { inertia: Infinity, collisionFilter: { category: 0x0001, mask: 0x0002 }});
        let ball = new Ball(body);
        population.push(ball);
        World.add(engine.world, body);
    }

    var settings = { isStatic: true, collisionFilter: { category: 0x0002 }, friction: 0 };
    World.add(engine.world, [
        // walls
        Bodies.rectangle(400, 0, 800, 50, settings),
        Bodies.rectangle(400, 600, 800, 50, settings),
        Bodies.rectangle(800, 300, 50, 600, settings),
        Bodies.rectangle(0, 300, 50, 600, settings)
    ]);


    //main engine update loop
    Events.on(engine, "afterUpdate", function(event) {
        population.forEach(function(ball) {
            ball.update();
        }) 
    });

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);
}