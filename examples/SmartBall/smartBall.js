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
    this.body.ball = this;
    this.done = false;
    this.counter = 0;
    this.distance = Infinity;
    this.jumps = [];
    // initialize jump genome
    for(var i = 0; i < 15; i++) {
        this.jumps.push(new Jump());
    }

    this.isMoving = function() {
        return Math.round(this.body.speed) != 0 || Math.round(this.body.angularVelocity) != 0;
    }

    // update
    this.update = function() {
        //console.log(this.counter);
        if(!this.isMoving()) {
            if (this.counter < 15) {
                let jump = this.jumps[this.counter++];
                this.body.force = {x: jump.x, y: jump.y};
            } 
            else {
                this.done = true;
            }
        }
    }
}

function distance(bodyA, bodyB) {
    let posA = bodyA.position;
    let posB = bodyB.position;
    return Math.sqrt((posA.x - posB.x)**2 + (posA.y - posB.y)**2);
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

    // init collision filters
    var defaultCategory = 0x0001;
    var ballCategory = 0x0002;

    var population = [];
    // generate the population 
    for (var i = 0; i < 50; i++) {
        let body = Bodies.circle(400, 560, 5, { inertia: Infinity, collisionFilter: { category: ballCategory, mask: defaultCategory }});
        let ball = new Ball(body);
        population.push(ball);
        World.add(engine.world, body);
    }

    var params = { isStatic: true, collisionFilter: { category: defaultCategory } };
    World.add(engine.world, [
        // walls
        Bodies.rectangle(400, -26, 800, 50, params),
        Bodies.rectangle(400, 626, 800, 50, params),
        Bodies.rectangle(826, 300, 50, 600, params),
        Bodies.rectangle(-26, 300, 50, 600, params)
    ]);

    // add target
    var target = Bodies.circle(200, 400, 10, params);
    World.add(engine.world, target);

    // main engine update loop
    Events.on(engine, "afterUpdate", function(event) {
        let generationEnd = true;
        population.forEach(function(ball) {
            if (!ball.done) {
                ball.update();
                let dist = distance(ball.body, target);
                if (dist < ball.distance) {
                    ball.distance = dist;
                }
                generationEnd = false;
            }
        });
    });

    // collision handling
    Events.on(engine, "collisionEnd", function(event) {
        var pairs = event.pairs.slice();
        pairs.forEach(function(pair) {
            if (pair.bodyA.collisionFilter.category == ballCategory && pair.bodyB == target) {
                World.remove(engine.world, pair.bodyA);
                pair.bodyA.ball.distance = 0;
                pair.bodyA.ball.done = true;
                console.log(pair.bodyA);
            }
        })
    })

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);
}