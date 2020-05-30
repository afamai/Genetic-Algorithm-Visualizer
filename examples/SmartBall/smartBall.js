class Jump {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.randomize();
    }

    randomize() {
        let power = Math.random() * 0.007;
        let angle = Math.random() * Math.PI + Math.PI;
        this.x = Math.cos(angle) * power;
        this.y = Math.sin(angle) * power;
    };
}

class Ball {
    constructor(x, y, radius, params) {
        this.body = Matter.Bodies.circle(x, y, radius, params);
        this.body.ball = this;
        this.startPosition = {x: x, y: y};
        this.done = false;
        this.counter = 0;
        this.distanceToTarget = Infinity;

        // initialize jumps
        this.jumps = [];
        for(var i = 0; i < 25; i++) {
            this.jumps.push(new Jump());
        }
    }

    isMoving() {
        return Math.round(this.body.speed) != 0 || Math.round(this.body.angularVelocity) != 0;
    }

    getFitness() {
        return 1 / (1 + this.distanceToTarget);
    }

    reset() {
        Matter.Body.setPosition(this.body, this.startPosition);
        this.counter = 0;
        this.distanceToTarget = Infinity;
        this.done = false;
    }

    // update
    update() {
        if(!this.isMoving()) {
            if (this.counter < 25) {
                let jump = this.jumps[this.counter++];
                this.body.force = {x: jump.x, y: jump.y};
            } 
            else {
                this.done = true;
            }
        }
        else {
            this.done = this.body.velocity.y > 25;
        }
    }
}

// INITIALIZATION
function init() {
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
       canvas: $("canvas")[0],
       engine: engine
   });

   // init collision filters
   var defaultCategory = 0x0001;
   var ballCategory = 0x0002;

   var size = 200;
   var population = [];
   // generate the population 
   for (var i = 0; i < size; i++) {
       let ball = new Ball(400, 582, 8, { inertia: Infinity, collisionFilter: { category: ballCategory, mask: defaultCategory }});

       population.push(ball);
       World.add(engine.world, ball.body);
   }

   var params = { isStatic: true, collisionFilter: { category: defaultCategory } };
   World.add(engine.world, [
       // walls
       //Bodies.rectangle(400, -90, 1200, 200, params),
       Bodies.rectangle(400, 690, 10000, 200, params),
       //Bodies.rectangle(890, 300, 200, 1000, params),
       //Bodies.rectangle(-90, 300, 200, 1000, params),
       // platforms
       Bodies.rectangle(400, 150, 100, 20, params),
       Bodies.rectangle(600, 150, 100, 20, params),
       Bodies.rectangle(220, 230, 100, 20, params),
       Bodies.rectangle(400, 320, 100, 20, params),
       Bodies.rectangle(280, 420, 100, 20, params),
       Bodies.rectangle(520, 420, 100, 20, params),
       Bodies.rectangle(150, 520, 100, 20, params),
       Bodies.rectangle(650, 520, 100, 20, params)
   ]);

   // add target
   var target = Bodies.circle(600, 100, 10, params);
   World.add(engine.world, target);

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
   });

   // run the renderer
   Render.run(render);

   // initialize instance object
   var instance = {
        population: population,
        engine: engine,
        target: target,
        generation: 0,
        counter: 1,
        speed: 1,
        size: size,
        selectionMethod: "rouletteWheelSelection",
        crossoverMethod: "singlePointCrossover",
        crossoverRate: 0.8,
        mutationMethod: "randomResetting",
        mutationRate: 0.1
    }

   return instance;
}

function runGeneration(instance) {
    if (instance.pause)
        return;
    let engine = instance.engine;
    let population = instance.population;
    let target = instance.target;

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
        // requestAnimationFrame(function() { runGeneration(population, engine, target); });
        if (instance.counter >= instance.speed) {
            instance.counter = 1;
            requestAnimationFrame(function() { runGeneration(instance); });
        }
        else {
            instance.counter++;
            runGeneration(instance);
        }
    }
    else {
        updateStatistics(population, ++instance.generation);
        newGeneration(population);
        population.forEach(function(ball) {
            ball.reset();
        });
        requestAnimationFrame(function() { runGeneration(instance); });
    }
}

function newGeneration(population) {
    // get parents
    console.log("get parents");
    var parents = rouletteWheelSelection(population, population.length);

    console.log("produce offsprings")
    var genomes = [];
    parents.forEach(function(pair) {
        let jumps = singlePointCrossover(pair.parentA.jumps, pair.parentB.jumps, 0.8);
        randomResetting(jumps, 0.01);
        genomes.push(jumps);
    });
    console.log("done production")
    population.forEach(function(ball, index) {
        ball.jumps = genomes[index];
    });
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

    console.log(crossoverRate);
    console.log(mutationRate);

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
    return valid;
}

$(document).ready(function() {
    var instance = init();
    
    // initialize the ui
    $("#population").val(instance.size);
    $("#selection-method").val(instance.selectionMethod);
    $("#crossover-method").val(instance.crossoverMethod);
    $("#crossover-rate").val(instance.crossoverRate);
    $("#mutation-method").val(instance.mutationMethod);
    $("#mutation-rate").val(instance.mutationRate);

    $("#apply,#restart").click(function() {
        let valid = validation();
        if (valid) {
            instance.size = $("#population").val();
            instance.selectionMethod = $("#selection-method").val();
            instance.crossoverMethod = $("#crossover-method").val();
            instance.crossoverRate = $("#crossover-rate").val();
            instance.mutationMethod = $("#mutation-method").val();
            instance.mutationRate = $("#mutation-rate").val();
            console.log(instance);
            $("#alert").show().removeClass();
            $("#alert").addClass("alert alert-success").text("Successfully applied settings");
            $("#alert").fadeOut(2000);

            if($(this).attr("id") == "restart") {
                console.log("restart");
            }
        } 
        else {
            $("#alert").show().removeClass();
            $("#alert").addClass("alert alert-danger").text("Failed to apply settings");
            $("#alert").fadeOut(2000);
        }
    });

    $("#play").click(function() {
        instance.pause = false;
        runGeneration(instance);
        $(this).addClass("disabled").prop( "disabled", true);
        $("#pause").removeClass("disabled").prop( "disabled", false);
    });

    $("#pause").click(function() {
        instance.pause = true;
        $(this).addClass("disabled").prop( "disabled", true);
        $("#play").removeClass("disabled").prop( "disabled", false);
    })

    $("#fast-forward").click(function() {
        console.log(instance)
        if (instance.speed == 32) {
            instance.speed = 1;
        }
        else {
            instance.speed *= 2;
        }
        $("#speed").text("x" + instance.speed);
    });

});