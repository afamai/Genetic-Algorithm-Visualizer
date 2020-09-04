var outputCanvas = null;
var outputContext = null;
var offscreenCanvas = null;
var offscreenContext = null;
var referenceData = null;
var instance = null;
var interval = null;
var totalTime = 0;

class PolygonImage {
    constructor() {
        this.genome = [];
        this.imageData = null;
    }

    randomize() {
        // generate a random dna
        for (let i = 0; i < 125; i++) {
            // random RGBA values
            this.genome.push(Math.random(), Math.random(), Math.random(), Math.max(Math.random() * Math.random(), 0.2));
            // random vertices
            let x = Math.random();
            let y = Math.random();
            for (let j = 0; j < 3; j++) {
                this.genome.push(x + Math.random() - 0.5, y + Math.random() - 0.5);
            }
        }
    }

    draw(ctx) {
        // draw polygons onto offscreen canvas to obtain image data
        let width = ctx.canvas.width;
        let height = ctx.canvas.height;
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(0, 0, width, height);
        for(let i = 0; i < this.genome.length; i += 10) {
            ctx.fillStyle = 'rgba(' +
                ((this.genome[i] * 255) >> 0) + ',' +
                ((this.genome[i + 1] * 255) >> 0) + ',' +
                ((this.genome[i + 2] * 255) >> 0) + ',' +
                this.genome[i + 3] + ')';
            
            ctx.beginPath();
            ctx.moveTo(this.genome[i + 4] * width, this.genome[i + 5] * height);
            for (let j = 6; j < 9; j += 2) {
                ctx.lineTo(this.genome[i + j] * width, this.genome[i + j + 1] * height);
            }
            //ctx.lineTo(this.genome[i + 4] * width, this.genome[i + 5] * height);
            ctx.closePath();
            ctx.fill();
        }
        this.imageData = ctx.getImageData(0,0, width, height);
    }
}

// Calculate the sum square difference between 2 images
function similarity(referenceData1, referenceData2) {
    // loop through each pixel in both images
    let data1 = referenceData1.data;
    let data2 = referenceData2.data;
    let ssq = 0;
    for (let i = 0; i < data1.length; i++) {
        ssq += (data1[i] - data2[i])**2;
    }

    return 1 - ssq / (data1.length * 256 * 256);
}

function createPopulation(size) {
    let population = [];
    for (let i = 0; i < size; i++) {
        let image = new PolygonImage();
        image.randomize();
        image.draw(offscreenContext);
        population.push(image);
    }
    return population;
} 

function init() {
    // initialize global variables
    outputCanvas = document.getElementById("output");
    outputContext = outputCanvas.getContext("2d");

    // load reference image data
    let img = $("#reference")[0];
    let width = Math.round(img.width * 0.1);
    let height = Math.round(img.height *0.1);
    offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenContext = offscreenCanvas.getContext('2d');
    offscreenContext.drawImage(img, 0, 0, width, height);
    referenceData = offscreenContext.getImageData(0, 0, width, height);

    // Adjust output canvas dimensions
    outputCanvas.width = img.width;
    outputCanvas.height = img.height;
    outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.width);

    // initialize population
    let populationSize = 50;
    let population = createPopulation(populationSize);
    

    // initialize instance
    instance = {
        generation: 1,
        population: population,
        populationSize: populationSize,
        selectionMethod: "TOS",
        crossoverMethod: "UC",
        crossoverRate: 0.8,
        mutationMethod: "uniformMutation",
        mutationRate: 0.01,
        elitism: true,
        pause: true
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

    // input event to update slider values
    $(".form-control-range").on('input', function(evt) {
        let formGroup = $(evt.target).closest("div.form-group");
        $(formGroup).find("p.slider-value").text(evt.target.value);
    });

    // click event to update configuration
    $("#apply").on("click", applyConfig);

    // click event for playing and pausing the simulation
    $("#play").on("click", function(evt) {
        let $symbol = $(this).children("i");
        if ($symbol.hasClass("fa-play")) {
            $symbol.removeClass("fa-play").addClass("fa-pause");
            instance.pause = false;
            interval = setInterval(iterate, 0);
        }
        else if ($symbol.hasClass("fa-pause")) {
            $symbol.removeClass("fa-pause").addClass("fa-play");
            instance.pause = true;
            clearInterval(interval);
        }
    });

    // click event to clear the current simulation
    $("#stop").on("click", function(evt) {
        outputContext.fillStyle = 'rgb(0,0,0)';
        outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.width);
        
        // set the play button icon back to play
        let $symbol = $("#play").children("i");
        if ($symbol.hasClass("fa-pause")) {
            $symbol.removeClass("fa-pause").addClass("fa-play");
            instance.pause = true;
        }

        // remove the interval event to stop the simulation
        clearInterval(interval);
        
        // reset the population
        instance.population = createPopulation(instance.populationSize);
        // set generation number back to 1
        instance.generation = 0;
        totalTime = 0;
    });
}   

function newGeneration() {
    // get configuration
    let selectionMethod = instance.selectionMethod;
    let crossoverMethod = instance.crossoverMethod;
    let crossoverRate = instance.crossoverRate;
    let mutationMethod = instance.mutationMethod;
    let mutationRate = instance.mutationRate;
    let elitism = instance.elitism;
    let population = instance.population;

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

        let parent1 = _.cloneDeep(parents[0].genome);
        let parent2 = _.cloneDeep(parents[1].genome);

        let offspring = null;
        switch (crossoverMethod) {
            case "SPC":
                offspring = SPC(parent1, parent2, crossoverRate);
                break;
            case "TPC":
                offspring = TPC(parent1, parent2, crossoverRate);
                break;
            case "UC":
                offspring = UC(parent1, parent2, crossoverRate, 10);
                break;
        }
        
        switch (mutationMethod) {
            case "gaussianMutation":
                gaussianMutation(offspring, mutationRate, magnitude=0.1);
                break;
            case "uniformMutation":
                uniformMutation(offspring, mutationRate);
                break;
        }

        genomes.push(offspring);
    }

    if (population.length < instance.populationSize) {
        population.forEach(function(image, idx) {
            image.genome = [].concat(genomes[idx]);
            image.draw(offscreenContext);
        });

        // add extra indiviuals to the population
        for(let i = population.length; i < instance.populationSize; i++) {
            let image = new PolygonImage();
            image.genome = genomes[i];
            image.draw(offscreenContext);
            population.push(image);
        }
    }
    else {
        genomes.forEach(function(genome, idx) {
            population[idx].genome = genome;
            population[idx].draw(offscreenContext);
        });

        // remove the extra individuals
        if (population.length > instance.populationSize) {
            population.splice(instance.populationSize);
        }
    }
}

function iterate() {
    // evaluate the population
    let startTime = new Date().getTime();
    let population = instance.population;
    let best = population[0];
    let worst = population[0];
    let totalFitness = 0;
    for (let i = 0; i < population.length; i++) {
        let fitness = similarity(referenceData, population[i].imageData);
        totalFitness += fitness;
        population[i].fitness = fitness;
        if (fitness > best.fitness) {
            best = population[i];
        }
        if (fitness < worst.fitness) {
            worst = population[i];
        }
    }
    best.draw(outputContext);
    let average = totalFitness / instance.populationSize;

    newGeneration();

    totalTime += new Date().getTime() - startTime;

    // update the analytics
    $("#generation").text(instance.generation);
    $("#highest-fitness").text((best.fitness * 100).toFixed(2) + "%");
    $("#lowest-fitness").text((worst.fitness * 100).toFixed(2) + "%");
    $("#average-fitness").text((average * 100).toFixed(2) + "%");
    $("#average-time").text((totalTime / instance.generation).toFixed(2) + "ms")

    instance.generation++;
}

function applyConfig() {
    instance.populationSize = parseInt($("#population-slider").val());
    instance.selectionMethod = $("#selection-method").val();
    instance.crossoverMethod = $("#crossover-method").val();
    instance.crossoverRate = parseFloat($("#crossover-rate-slider").val());
    instance.mutationMethod = $("#mutation-method").val();
    instance.mutationRate = parseFloat($("#mutation-rate-slider").val());
    instance.elitism = $("#elitism").is(':checked');
}

$(document).ready(function() {
    $("#reference").on("load", init);
});


