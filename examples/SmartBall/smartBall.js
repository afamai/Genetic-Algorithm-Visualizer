class Jump {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.randomize();
    }

    randomize() {
        let power = Math.random() * 100 + 30;
        let angle = Math.random() * Math.PI;
        this.x = Math.cos(angle) * power;
        this.y = Math.sin(angle) * power;
    };
}

class Ball {
    constructor(body) {
        this.body = body;
        let position = body.GetPosition();
        this.startPosition = new b2Vec2(position.x, position.y);
        this.done = false;
        this.counter = 0;
        this.onGround = true;
        this.distanceToTarget = Infinity;
        this.best = false;
        this.isElite = false;

        // initialize jumps
        this.jumps = [];
        for(var i = 0; i < 20; i++) {
            this.jumps.push(new Jump());
        }
    }

    getFitness() {
        if(this.isElite) {
            return 1;
        }
        return 1 / this.distanceToTarget;
    }

    reset() {
        this.body.SetTransform(this.startPosition, this.body.GetAngle());
        this.counter = 0;
        this.distanceToTarget = Infinity;
        this.done = false;
    }

    // update
    update() {
        let velocity = this.body.GetLinearVelocity();
        if(velocity.y == 0) {
            if (this.counter < this.jumps.length) {
                let jump = this.jumps[this.counter++];
                this.body.ApplyForceToCenter(new b2Vec2(jump.x, jump.y), true);
            } 
            else {
                this.done = true;
            }
        }

        let position = this.body.GetPosition();
        if (position.x > 20.0) {
            this.body.SetTransform(new b2Vec2(-20, position.y), this.body.GetAngle());
        }
        else if (position.x < -20) {
            this.body.SetTransform(new b2Vec2(20, position.y), this.body.GetAngle());
        }
    }
}

var world = null;
var canvas = null;
var context = null;
var population = null;
var target = null;

function init() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext('2d');

    world = new b2World(new b2Vec2(0.0, -15.0));

    let ground = world.CreateBody(new b2BodyDef());

    let shape = new b2EdgeShape();
    shape.Set(new b2Vec2(-20, -14.0), new b2Vec2(20.0, -14.0));
    ground.CreateFixture(shape, 0.0);

    shape = new b2PolygonShape();
    shape.SetAsBox(2, 0.3, new b2Vec2(0, 0), 0);
    ground.CreateFixture(shape, 0.0);

    // generate initial population
    let populationSize = 1;
    let startPosition = new b2Vec2(0, -13.5);
    var defaultCategory = 0x0001;
    var ballCategory = 0x0002;

    population = [];
    for (let i = 0; i < populationSize; i++) {
        let bodyDef = new b2BodyDef();
        bodyDef.set_position(startPosition);
        bodyDef.set_type(b2_dynamicBody);
        let body = world.CreateBody(bodyDef);

        let circle = new b2CircleShape();
        circle.set_m_radius(0.5);

        let fixtureDef = new b2FixtureDef();
        fixtureDef.shape = circle;
        fixtureDef.density = 0.2;
        fixtureDef.friction = 1;

        fixtureDef.filter.categoryBits = ballCategory;
        fixtureDef.filter.maskBits = defaultCategory;

        body.CreateFixture(fixtureDef);
        body.SetFixedRotation(true);
        console.log(body);

        population.push(new Ball(body));
    }

    // create target
    let bodyDef = new b2BodyDef();
    bodyDef.set_position(new b2Vec2(10, 10));
    target = world.CreateBody(bodyDef);

    let circle = new b2CircleShape();
    circle.set_m_radius(1);
    let fixtureDef = new b2FixtureDef();
    fixtureDef.shape = circle;
    fixtureDef.filter.categoryBits = defaultCategory;

    target.CreateFixture(fixtureDef);
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
    population.forEach(function (ball) {
        let targetPos = target.GetPosition();
        if (!ball.done) {
            ball.update();
            let pos = ball.body.GetPosition();
            let dist = Math.sqrt((targetPos.x - pos.x)**2 + (targetPos.y - pos.y)**2);
            if (dist < ball.distanceToTarget) {
                ball.distanceToTarget = dist;
            }
            console.log(ball.distanceToTarget);
            generationEnd = false;
        }
    });

    if (generationEnd) {
        population.forEach(ball => ball.reset());
    }
    draw();
}

function newGeneration(instance) {
    console.log(tick);
    tick = 0;
    // get parents
    let population = instance.population;
    let selectionMethod = instance.selectionMethod;
    let mutationMethod = instance.mutationMethod;
    let mutationRate = instance.mutationRate;
    let crossoverMethod = instance.crossoverMethod;
    let crossoverRate = instance.crossoverRate;
    let elitesToKeep = instance.elitesToKeep;

    let genomes = [];
    if (elitesToKeep > 0) {
        population.sort((a, b) => a.getFitness() > b.getFitness() ? -1 : 1);
        genomes = [init_jumps];
        // genomes = population.slice(0, elitesToKeep).map((v) => v.jumps);
        // population[0].jumps.forEach(function(j) {
        //     console.log(j.x, j.y);
        // })
    }

    console.log(same(population[0].jumps, genomes[0]));
    let isSame = same(population[0].jumps, init_jumps);
    console.log(isSame)
    // init_jumps.forEach(function(e) {
    //     console.log(e);
    // })

    console.log("------------")
    population.forEach(function(e) {
        console.log(e.getFitness(), e.distanceToTarget);
    })
    console.log("------------")

    for (var i = genomes.length; i < instance.size; i++) {
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
        switch (crossoverMethod) {
            case "SPC":
                offspring = SPC(parents[0].jumps, parents[1].jumps, crossoverRate);
                break;
            case "TPC":
                offspring = TPC(parents[0].jumps, parents[1].jumps, crossoverRate);
                break;
        }
        
        switch (mutationMethod) {
            case "randomResetting":
                randomResetting(offspring, mutationRate);
                break;
            case "swapMutation":
                swapMutation(offspring, mutationRate);
                break;
            case "scrambleMutation":
                scrambleMutation(offspring, mutationRate);
                break;
            case "inversionMutation":
                inversionMutation(offspring, mutationRate);
                break;
        }

        genomes.push(offspring);
    }

    if (population.length < instance.size) {
        population.forEach(function(ball, idx) {
            ball.jumps = genomes[idx];
            ball.reset();
        });

        // add extra indiviuals to the population
        let filter = population[0].body.collisionFilter;
        for(let i = population.length; i < instance.size; i++) {
            let circle = Matter.Bodies.circle(400, 582, 8);
            let sensor = Matter.Bodies.circle(400, 590, 0.1, { isSensor: true })
            let body = Body.create({ parts: [circle, sensor], inertia: Infinity, collisionFilter: filter})
            let ball = new Ball(body);
            ball.jumps = genomes[i];
            population.push(ball);
            Matter.World.add(instance.engine.world, ball.body);
        }
    }
    else {
        genomes.forEach(function(jumps, idx) {
            population[idx].jumps = jumps;
            population[idx].reset();
        });

        // remove the extra individuals
        if (population.length > instance.size) {
            let removed = population.splice(instance.size);
            removed.forEach(function(ball) {
                Matter.World.remove(instance.engine.world, ball.body);
            });
        }
    }
}

function distance(bodyA, bodyB) {
    let posA = bodyA.position;
    let posB = bodyB.position;
    return Math.sqrt((posA.x - posB.x)**2 + (posA.y - posB.y)**2);
}

function validation() {
    let valid = true
    let populationSize = parseInt($("#population").val());
    let crossoverRate = parseFloat($("#crossover-rate").val());
    let mutationRate = parseFloat($("#mutation-rate").val());
    let elitesToKeep = parseInt($("#elite-amount").val());

    // population size validation
    if (isNaN(populationSize)) {
        $("#population-error").text("Must be a valid number");
        $("#population").addClass("is-invalid");
        valid = false;
    } 
    else if (populationSize < 1 || populationSize > 500){
        $("#population-error").text("Population size must be between 1 - 500");
        $("#population").addClass("is-invalid");
        valid = false
    }
    else {
        $("#population").removeClass("is-invalid");
    }

    // crossover rate validation
    if (isNaN(crossoverRate)) {
        $("#crossover-rate-error").text("Must be a valid number");
        $("#crossover-rate").addClass("is-invalid");
        valid = false;
    } 
    else if (crossoverRate < 0 || crossoverRate > 1){
        console.log(crossoverRate)
        $("#crossover-rate-error").text("Crossover rate must be between 0.0 - 1.0");
        $("#crossover-rate").addClass("is-invalid");
        valid = false
    }
    else {
        $("#crossover-rate").removeClass("is-invalid");
    }

    // mutation rate validation
    if (isNaN(mutationRate)) {
        $("#mutation-rate-error").text("Must be a valid number");
        $("#mutation-rate").addClass("is-invalid");
        valid = false;
    } 
    else if (mutationRate < 0.0 || mutationRate > 1.0){
        $("#mutation-rate-error").text("Mutation rate must be between 0.0 - 1.0");
        $("#mutation-rate").addClass("is-invalid");
        valid = false
    }
    else {
        $("#mutation-rate").removeClass("is-invalid");
    }
    
    // elites to keep validation
    if (isNaN(elitesToKeep)) {
        $("#elite-amount-error").text("Must be a valid number");
        $("#elite-amount").addClass("is-invalid");
        valid = false;
    } 
    else if (elitesToKeep < 0 || elitesToKeep > 15){
        $("#elite-amount-error").text("Elites to keep must be between 1 - 15" );
        $("#elite-amount").addClass("is-invalid");
        valid = false
    }
    else {
        $("#elite-amount").removeClass("is-invalid");
    }
    return valid;
}
var b2 = null;

function animate() {
    requestAnimationFrame(animate);
    step();
}

$(document).ready(function() {
    //var instance = init();
    Box2D().then(function(Box2D) {
        using(Box2D, "b2.+");
        this.Box2D = Box2D;
        console.log(Box2D);
        init();
        animate();
    });
    
    // initialize the ui
    // $("#population").val(instance.size);
    // $("#selection-method").val(instance.selectionMethod);
    // $("#crossover-method").val(instance.crossoverMethod);
    // $("#crossover-rate").val(instance.crossoverRate);
    // $("#mutation-method").val(instance.mutationMethod);
    // $("#mutation-rate").val(instance.mutationRate);
    // $("#elite-amount").val(instance.elitesToKeep);

    // $("#apply,#new-run").click(function() {
    //     let valid = validation(instance);
    //     if (valid) {
    //         instance.size = parseInt($("#population").val());
    //         instance.selectionMethod = $("#selection-method").val();
    //         instance.crossoverMethod = $("#crossover-method").val();
    //         instance.crossoverRate = parseFloat($("#crossover-rate").val());
    //         instance.mutationMethod = $("#mutation-method").val();
    //         instance.mutationRate = parseFloat($("#mutation-rate").val());
    //         instance.elitesToKeep = parseInt($("#elite-amount").val());

    //         $("#alert").show().removeClass();
    //         $("#alert").addClass("alert alert-success").text("Successfully applied settings");
    //         $("#alert").fadeOut(2000);

    //         if($(this).attr("id") == "new-run") {
    //             instance.generation = 0;
    //         }
    //     } 
    //     else {
    //         $("#alert").show().removeClass();
    //         $("#alert").addClass("alert alert-danger").text("Failed to apply settings");
    //         $("#alert").fadeOut(2000);
    //     }
    // });

    // $("#play").click(function() {
    //     instance.pause = false;
    //     $(this).addClass("disabled").prop( "disabled", true);
    //     $("#pause").removeClass("disabled").prop( "disabled", false);
    //     runGeneration(instance);
    // });

    // $("#pause").click(function() {
    //     instance.pause = true;
    //     $(this).addClass("disabled").prop( "disabled", true);
    //     $("#play").removeClass("disabled").prop( "disabled", false);
    // })

    // $("#fast-forward").click(function() {
    //     if (instance.speed == 32) {
    //         instance.speed = 1;
    //     }
    //     else {
    //         instance.speed *= 2;
    //     }
    //     $("#speed").text("x" + instance.speed);
    // });

});