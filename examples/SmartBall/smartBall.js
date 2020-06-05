class Jump {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.randomize();
    }

    randomize() {
        let power = Math.random() * 0.005 + 0.003;
        let angle = Math.random() * Math.PI + Math.PI;
        this.x = Math.cos(angle) * power;
        this.y = Math.sin(angle) * power;
    };
}

class Ball {
    constructor(body) {
        this.body = body;
        this.body.ball = this;
        this.startPosition = {x: body.position.x, y: body.position.y};
        this.done = false;
        this.counter = 0;
        this.onGround = true;
        this.distanceToTarget = Infinity;

        // initialize jumps
        this.jumps = [];
        for(var i = 0; i < 20; i++) {
            this.jumps.push(new Jump());
        }
    }

    isMoving() {
        return Math.round(this.body.speed) != 0 || Math.round(this.body.angularVelocity) != 0;
    }

    getFitness() {
        return 1 / this.distanceToTarget;
    }

    reset() {
        Matter.Body.setPosition(this.body, this.startPosition);
        this.counter = 0;
        this.distanceToTarget = Infinity;
        this.done = false;
    }

    // update
    update() {
        if(!this.isMoving() && this.onGround) {
            if (this.counter < this.jumps.length) {
                let jump = this.jumps[this.counter++];
                this.body.force = {x: jump.x, y: jump.y};
            } 
            else {
                this.done = true;
            }
        }
        else {
            this.done = this.body.velocity.y > 24;
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
    Body = Matter.Body;

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
       let circle = Matter.Bodies.circle(400, 582, 8);
       let sensor = Matter.Bodies.circle(400, 590, 1, { isSensor: true })
       let body = Body.create({ parts: [circle, sensor], inertia: Infinity, collisionFilter: { category: ballCategory, mask: defaultCategory }})
       let ball = new Ball(body);

       population.push(ball);
       World.add(engine.world, ball.body);
   }

   var params = { isStatic: true, collisionFilter: { category: defaultCategory } };
   World.add(engine.world, [
       // walls
       //Bodies.rectangle(400, -90, 1200, 200, params),
       Bodies.rectangle(400, 690, 1000, 200, params),
       //Bodies.rectangle(890, 300, 200, 1000, params),
       //Bodies.rectangle(-90, 300, 200, 1000, params),
       // platforms
       Bodies.rectangle(400, 180, 100, 5, params),
       Bodies.rectangle(600, 180, 100, 5, params),
       Bodies.rectangle(220, 260, 100, 5, params),
       Bodies.rectangle(400, 350, 100, 5, params),
       Bodies.rectangle(280, 450, 100, 5, params),
       Bodies.rectangle(520, 450, 100, 5, params),
       Bodies.rectangle(150, 520, 100, 5, params),
       Bodies.rectangle(650, 520, 100, 5, params)
   ]);

   // add target
   var target = Bodies.circle(220, 220, 20, params);
   World.add(engine.world, target);

   // collision handling
   Events.on(engine, "collisionStart", function(event) {
        var pairs = event.pairs.slice();
        pairs.forEach(function(pair) {
            // check if ball has hit the ground
            if (pair.isSensor) {
                if (pair.bodyA.isSensor) {
                    pair.bodyA.parent.ball.onGround = true;
                }
                else {
                    pair.bodyB.parent.ball.onGround = true;
                }
            }
        })
   });

   Events.on(engine, "collisionActive", function(event) {
        var pairs = event.pairs.slice();
        pairs.forEach(function(pair) {
            // check if ball has hit the ground
            if (pair.isSensor) {
                if (pair.bodyA.isSensor) {
                    pair.bodyA.parent.ball.onGround = true;
                }
                else {
                    pair.bodyB.parent.ball.onGround = true;
                }
            }
        })
    })

   Events.on(engine, "collisionEnd", function(event) {
       var pairs = event.pairs.slice();
       pairs.forEach(function(pair) {
           // check if ball collide with the target
           if (pair.bodyA.collisionFilter.category == ballCategory && pair.bodyB == target) {
               World.remove(engine.world, pair.bodyA);
               pair.bodyA.ball.distanceToTarget = 0;
               pair.bodyA.ball.done = true;
           }
           // check if ball has left the ground
           if (pair.isSensor) {
               if (pair.bodyA.isSensor) {
                   pair.bodyA.parent.ball.onGround = false;
               }
               else {
                   pair.bodyB.parent.ball.onGround = false;
               }
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
        selectionMethod: "RWS",
        crossoverMethod: "TPC",
        crossoverRate: 0.85,
        mutationMethod: "randomResetting",
        mutationRate: 0.05,
        elitesToKeep: 10
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
            
            // calculate the distance between the ball and target
            let dist = distance(ball.body, target);
            if (dist < ball.distanceToTarget) {
                ball.distanceToTarget = dist;
            }
            
            // ensure that the ball is within the boundaries
            let position = ball.body.position
            if (position.x > 800) {
                Matter.Body.setPosition(ball.body, {x: 0, y: position.y});
            }
            else if (position.x < 0) {
                Matter.Body.setPosition(ball.body, {x: 800, y: position.y});
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
        newGeneration(instance);
        requestAnimationFrame(function() { runGeneration(instance); });
    }
}

function newGeneration(instance) {
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
        genomes = population.slice(0, elitesToKeep).map((v) => v.jumps);
    }

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
            let sensor = Matter.Bodies.circle(400, 590, 0.05, { isSensor: true })
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

$(document).ready(function() {
    var instance = init();
    
    // initialize the ui
    $("#population").val(instance.size);
    $("#selection-method").val(instance.selectionMethod);
    $("#crossover-method").val(instance.crossoverMethod);
    $("#crossover-rate").val(instance.crossoverRate);
    $("#mutation-method").val(instance.mutationMethod);
    $("#mutation-rate").val(instance.mutationRate);
    $("#elite-amount").val(instance.elitesToKeep);

    $("#apply,#new-run").click(function() {
        let valid = validation(instance);
        if (valid) {
            instance.size = parseInt($("#population").val());
            instance.selectionMethod = $("#selection-method").val();
            instance.crossoverMethod = $("#crossover-method").val();
            instance.crossoverRate = parseFloat($("#crossover-rate").val());
            instance.mutationMethod = $("#mutation-method").val();
            instance.mutationRate = parseFloat($("#mutation-rate").val());
            instance.elitesToKeep = parseInt($("#elite-amount").val());

            $("#alert").show().removeClass();
            $("#alert").addClass("alert alert-success").text("Successfully applied settings");
            $("#alert").fadeOut(2000);

            if($(this).attr("id") == "new-run") {
                instance.generation = 0;
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
        if (instance.speed == 32) {
            instance.speed = 1;
        }
        else {
            instance.speed *= 2;
        }
        $("#speed").text("x" + instance.speed);
    });

});