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
    this.distanceToTarget = Infinity;
    this.jumps = [];

    // initialize genome/jumps
    for(var i = 0; i < 15; i++) {
        this.jumps.push(new Jump());
    }

    this.isMoving = function() {
        return Math.round(this.body.speed) != 0 || Math.round(this.body.angularVelocity) != 0;
    }

    this.getFitness = function() {
        return 1 / 1 + this.distanceToTarget;
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

function runGeneration(population, engine, target) {
    Matter.Engine.update(engine);

    let generationEnd = true;
    population.forEach(function(ball) {
        if (!ball.done) {
            ball.update();
            let dist = distance(ball.body, target);
            if (dist < ball.distanceToTarget) {
                ball.distanceToTarget = dist;
            }
            generationEnd = false;
        }
    });

    if (!generationEnd) {
        requestAnimationFrame(function() { runGeneration(population, engine, target); });
    }
    else {
        console.log(population, engine, target);
    }
}

function newGeneration(population) {

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

    var size = 50;
    var population = [];
    // generate the population 
    for (var i = 0; i < size; i++) {
        let body = Bodies.circle(400, 560, 5, { collisionFilter: { category: ballCategory, mask: defaultCategory }});
        let ball = new Ball(body);
        population.push(ball);
        World.add(engine.world, body);
    }

    var params = { isStatic: true, collisionFilter: { category: defaultCategory } };
    World.add(engine.world, [
        // walls
        Bodies.rectangle(400, -20, 800, 50, params),
        Bodies.rectangle(400, 620, 800, 50, params),
        Bodies.rectangle(820, 300, 50, 600, params),
        Bodies.rectangle(-20, 300, 50, 600, params)
    ]);
    // add target
    var target = Bodies.circle(200, 400, 10, params);
    World.add(engine.world, target);

    
    //id = setInterval(function() { runGeneration(population, engine, target); }, 1000/60);
    // main engine update loop
    // Events.on(engine, "afterUpdate", function(event) {
    //     let generationEnd = true;
    //     population.forEach(function(ball) {
    //         if (!ball.done) {
    //             ball.update();
    //             let dist = distance(ball.body, target);
    //             if (dist < ball.distanceToTarget) {
    //                 ball.distanceToTarget = dist;
    //             }
    //             generationEnd = false;
    //         }
    //     });

    //     if (generationEnd) {
            
    //         population.forEach(function(ball) {
    //             World.remove(engine.world, ball.body);
    //         });

    //         var parents = rouletteWheelSelection(population, size);
    //     }
    // });

    // collision handling
    Events.on(engine, "collisionEnd", function(event) {
        var pairs = event.pairs.slice();
        pairs.forEach(function(pair) {
            if (pair.bodyA.collisionFilter.category == ballCategory && pair.bodyB == target) {
                World.remove(engine.world, pair.bodyA);
                pair.bodyA.ball.distanceToTarget = 0;
                pair.bodyA.ball.done = true;
            }
        })
    })

    
    // run the engine
    // Engine.run(engine);
    runGeneration(population, engine, target);

    // run the renderer
    Render.run(render);
}