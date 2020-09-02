var world = null;
var canvas = null;
var context = null;
var startPosition = null;
var target = null;
var instance = null;
var counter = 1;
var minJumpStr = 50;
var maxJumpStr = 150;
var minAngle = 0;
var maxAngle = Math.PI;
var geneLength = 2;

class Ball {
    constructor(startPos) {
        this.startPosition = startPos;

        this.done = false;
        this.counter = 0;
        this.fitness = 0;

        // initialize genome as an array of jumps
        this.genome = [];
        for(var i = 0; i < 20; i++) {
            // add random angle and jump strength
            this.genome.push(Math.random(), Math.random());
        }

        this.createBody();
    }

    createBody() {
        let bodyDef = new b2BodyDef();
        bodyDef.set_position(this.startPosition);
        bodyDef.set_type(b2_dynamicBody);
        this.body = world.CreateBody(bodyDef);

        let circle = new b2CircleShape();
        circle.set_m_radius(0.4);

        let fixtureDef = new b2FixtureDef();
        fixtureDef.shape = circle;
        fixtureDef.density = 0.2;
        fixtureDef.friction = 5;

        fixtureDef.filter.categoryBits = 0x0002;
        fixtureDef.filter.maskBits = 0x0001;

        this.body.CreateFixture(fixtureDef);
        this.body.SetFixedRotation(true);
        this.body.ball = this;
    }

    reset() {
        // recreate the body if it was destroyed
        if (this.hit) {
            this.createBody();
        }
        // place the body back to the start position
        this.body.SetTransform(this.startPosition, this.body.GetAngle());
        this.counter = 0;
        this.distanceToTarget = Infinity;
        this.done = false;
        this.hit = false;
    }

    // update
    update() {
        // destroy body from world if it hits the target
        if (this.hit) {
            this.fitness = 1;
            world.DestroyBody(this.body);
            this.done = true;
        }

        // check to see if the ball is moving
        let velocity = this.body.GetLinearVelocity();
        if (velocity.y == 0 && velocity.x == 0) {
            // if not moving and theres still jumps left, make a jump
            if (this.counter < this.genome.length) {
                let angle = this.genome[this.counter++] * (maxAngle - minAngle) + minAngle;
                let strength = this.genome[this.counter++] * (maxJumpStr - minJumpStr) + minJumpStr;
                let x = Math.cos(angle) * strength;
                let y = Math.sin(angle) * strength;
                this.body.ApplyForceToCenter(new b2Vec2(x, y), true);
            } 
            else {
                this.done = true;
            }
        }

        
    }
}

function init() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext('2d');

    world = new b2World(new b2Vec2(0.0, -30.0));

    // generate the platforms
    let ground = world.CreateBody(new b2BodyDef());

    let shape = new b2EdgeShape();
    shape.Set(new b2Vec2(-20, -14.0), new b2Vec2(20.0, -14.0));
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2.5, 0.4, new b2Vec2(-10, -10), 0);
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2.5, 0.4, new b2Vec2(10, -10), 0);
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2.5, 0.4, new b2Vec2(0, -5), 0);
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2.5, 0.4, new b2Vec2(-10, 0), 0);
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2.5, 0.4, new b2Vec2(10, 0), 0);
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2.5, 0.4, new b2Vec2(0, 5), 0);
    ground.CreateFixture(shape, 0.0);

    // generate initial population
    let populationSize = 200;
    startPosition = new b2Vec2(0, -13.5);

    let population = [];
    for (let i = 0; i < populationSize; i++) {
        population.push(new Ball(startPosition));
    }

    // create target
    let bodyDef = new b2BodyDef();
    bodyDef.set_position(new b2Vec2(0, 10));
    target = world.CreateBody(bodyDef);

    let circle = new b2CircleShape();
    circle.set_m_radius(1);
    let fixtureDef = new b2FixtureDef();
    fixtureDef.shape = circle;

    target.CreateFixture(fixtureDef);

    // create collision listener
    let listener =  new Box2D.JSContactListener();
    listener.EndContact = function(contactPtr) {
        let contact = Box2D.wrapPointer(contactPtr, b2Contact);
        let fixtureA = contact.GetFixtureA();
        let fixtureB = contact.GetFixtureB();
        let bodyA = fixtureA.GetBody();
        let bodyB = fixtureB.GetBody();
        if (bodyB == target) {
            bodyA.ball.distanceToTarget = 1;
            bodyA.ball.hit = true;
        }
    }

    // Empty implementations for unused methods.
    listener.BeginContact = function() {};
    listener.PreSolve = function() {};
    listener.PostSolve = function() {};

    world.SetContactListener( listener );

    // init variables
    generation = 1;
    instance = {
        population: population,
        populationSize: populationSize,
        selectionMethod: "RWS",
        crossoverMethod: "TPC",
        crossoverRate: 0.8,
        mutationMethod: "uniformMutation",
        mutationRate: 0.01,
        elitism: true,
        generation: 1,
        speed: 1,
        pause: false
    }

    // initialize the ui
    $("#population").text(instance.populationSize);
    $("#population-slider").val(instance.populationSize);
    $("#selection-method").val(instance.selectionMethod);
    $("#crossover-method").val(instance.crossoverMethod);
    $("#crossover-rate").text(instance.crossoverRate);
    $("#crossover-rate-slider").val(instance.crossoverRate);
    $("#mutation-method").val(instance.mutationMethod);
    $("#mutation-rate").text(instance.mutationRate);
    $("#mutation-rate-slider").val(instance.mutationRate);
    $("#elitism").prop('checked', instance.elitism);
    $("#speed").text("x" + instance.speed);

    // input event to update slider values
    $(".form-control-range").on('input', function(evt) {
        let formGroup = $(evt.target).closest("div.form-group");
        $(formGroup).find("p.slider-value").text(evt.target.value);
    });

    // click event to update configuration
    $("#apply").click(applyConfig);

    // click event to reset simulation
    $("#stop").click(function() {
        let $symbol = $("#play").children("i");
        if ($symbol.hasClass("fa-pause")) {
            $symbol.removeClass("fa-pause").addClass("fa-play");
            instance.pause = true;
        }
        // remove all body from the world
        instance.population.forEach(function(ball) {
            world.DestroyBody(ball.body);
        });

        // create a new population
        instance.population = [];
        for (let i = 0; i < instance.populationSize; i++) {
            instance.population.push(new Ball(startPosition));
        }

        draw();
    })

    // click event for playing and pausing the simulation
    $("#play").click(function() {
        let $symbol = $(this).children("i");
        if ($symbol.hasClass("fa-play")) {
            $symbol.removeClass("fa-play").addClass("fa-pause");
            instance.pause = false;
            run();
        }
        else if ($symbol.hasClass("fa-pause")) {
            $symbol.removeClass("fa-pause").addClass("fa-play");
            instance.pause = true;
        }
    });

    // click event to speed up simulation
    $("#fast-forward").click(function() {
        if (instance.speed == 32) {
            instance.speed = 1;
        }
        else {
            instance.speed *= 2;
        }
        $("#speed").text("x" + instance.speed);
    });
        
}

function draw() {
    context.fillStyle = 'rgb(0,0,0)';
    context.fillRect( 0, 0, canvas.width, canvas.height );
    
    context.save();
    context.translate(canvas.width/2, canvas.height/2);          
    context.scale(1,-1); 
    context.scale(20, 20);
    context.lineWidth /= 20;

    context.strokeStyle = 'rgb(255, 255, 255)';
    for (body = world.GetBodyList(); body.a != 0; body = body.GetNext()) {
        for (fixture = body.GetFixtureList(); fixture.a != 0; fixture = fixture.GetNext()) {
            let type = fixture.GetType();
            if (type == b2Shape.e_edge) {
                let edge = Box2D.castObject(fixture.GetShape(), b2EdgeShape);
                context.beginPath();
                context.moveTo(edge.m_vertex1.x, edge.m_vertex1.y);
                context.lineTo(edge.m_vertex2.x, edge.m_vertex2.y);
                context.stroke();
            }
            else if (type == b2Shape.e_polygon) {
                let polygon = Box2D.castObject(fixture.GetShape(), b2PolygonShape);
                let vertexCount = polygon.m_count;
                
                // draw the polygon
                context.beginPath();
                let initPoint = polygon.GetVertex(0);
                context.moveTo(initPoint.x, initPoint.y);
                for (let i = 1; i < vertexCount; i++) {
                    let vertex = polygon.GetVertex(i);
                    context.lineTo(vertex.x, vertex.y);
                }
                // draw the last line back to the init point
                context.lineTo(initPoint.x, initPoint.y);
                context.stroke();
            }
            else if (type == b2Shape.e_circle) {
                let circle = Box2D.castObject(fixture.GetShape(), b2CircleShape);
                let position = body.GetPosition();
                context.beginPath();
                context.arc(position.x, position.y, circle.m_radius, 0, 2 * Math.PI);
                context.stroke();
            }
        }
    }
        
    context.restore();
}

function step() {
    world.Step(1/60, 8, 3);
    // find the distance between each ball and the target
    let generationEnd = true;
    let population = instance.population;
    population.forEach(function (ball) {
        if (!ball.done) {
            ball.update();
            let body = ball.body;
            let fitness = 1 / distance(body, target);
            if (fitness > ball.fitness) {
                ball.fitness = fitness;
            }

            let position = body.GetPosition();
            if (position.x > 20.0) {
                body.SetTransform(new b2Vec2(-20, position.y), body.GetAngle());
            }
            else if (position.x < -20) {
                body.SetTransform(new b2Vec2(20, position.y), body.GetAngle());
            }

            generationEnd = false;
        }
    });

    if (generationEnd) {
        let best = population[0];
        let worst = population[0];
        let average = 0;
        for (let i = 0; i < population.length; i++) {
            average += population[i].fitness;
            if (best.fitness < population[i].fitness) {
                best = population[i];
            }
            if (worst.fitness > population[i].fitness) {
                worst = population[i];
            }
        }
        average /= population.length;
        // update analytics
        $("#generation").text(instance.generation++);
        $("#highest-fitness").text((best.fitness).toFixed(5));
        $("#lowest-fitness").text((worst.fitness).toFixed(5));
        $("#average-fitness").text((average).toFixed(5));
        newGeneration();
    }
}

function newGeneration() {
    // get parameters
    let population = instance.population;
    let selectionMethod = instance.selectionMethod;
    let mutationMethod = instance.mutationMethod;
    let mutationRate = instance.mutationRate;
    let crossoverMethod = instance.crossoverMethod;
    let crossoverRate = instance.crossoverRate;
    let elitism = instance.elitism;

    let genomes = [];
    // if elitism is enabled, place the best genome into the next generation
    if (elitism) {
        population.sort((a, b) => a.fitness > b.fitness ? -1 : 1);
        genomes.push(population[0].genome);
    }

    for (var i = genomes.length; i < instance.populationSize; i++) {
        let parents = [];
        switch (selectionMethod) {
            case "RWS":
                parents = RWS(population, 2);
                break;
            case "SUS":
                parents = SUS(population, 2);
                break;
            case "TOS":
                parents = TOS(population, 2, 8);
                break;
        }
        let offspring = null;
        let parent1 = _.cloneDeep(parents[0].genome);
        let parent2 = _.cloneDeep(parents[1].genome);
        switch (crossoverMethod) {
            case "SPC":
                offspring = SPC(parent1, parent2, crossoverRate, 2);
                break;
            case "TPC":
                offspring = TPC(parent1, parent2, crossoverRate, 2);
                break;
            case "UC":
                offspring = UC(parent1, parent2, crossoverRate, 2);
                break;
        }
        
        switch (mutationMethod) {
            case "gaussianMutation":
                gaussianMutation(offspring, mutationRate);
                break;
            case "uniformMutation":
                uniformMutation(offspring, mutationRate);
                break;
        }

        genomes.push(offspring);
    }

    if (population.length < instance.populationSize) {
        population.forEach(function(ball, idx) {
            ball.genome = [].concat(genomes[idx]);
            ball.reset();
        });

        // add extra indiviuals to the population
        for(let i = population.length; i < instance.populationSize; i++) {
            let ball = new Ball(startPosition);
            ball.genome = genomes[i];
            population.push(ball);
        }
    }
    else {
        genomes.forEach(function(genome, idx) {
            population[idx].genome = genome;
            population[idx].reset();
        });

        // remove the extra individuals
        if (population.length > instance.populationSize) {
            let removed = population.splice(instance.populationSize);
            removed.forEach(function(ball) {
                world.DestroyBody(ball.body);
            });
        }
    }
}

function distance(bodyA, bodyB) {
    let posA = bodyA.GetPosition();
    let posB = bodyB.GetPosition();
    return Math.sqrt((posA.x - posB.x)**2 + (posA.y - posB.y)**2);
}

function run() {
    if (instance.pause)
        return;

    step();
    if (counter >= instance.speed) {
        draw();
        requestAnimationFrame(run);
        counter = 1;
    }
    else {
        counter++;
        run();
    }
}

function applyConfig() {
    instance.populationSize = parseInt($("#population-slider").val());
    instance.selectionMethod = $("#selection-method").val();
    instance.crossoverMethod = $("#crossover-method").val();
    instance.crossoverRate = parseFloat($("#crossover-rate-slider").val());
    instance.mutationMethod = $("#mutation-method").val();
    instance.mutationRate = parseFloat($("#mutation-rate-slider").val());
    instance.elitism = $("#elitism").is(':checked');
    console.log(instance);
}

$(document).ready(function() {
    Box2D().then(function(Box2D) {
        using(Box2D, "b2.+");
        this.Box2D = Box2D;
        init();
        draw();
    });
});