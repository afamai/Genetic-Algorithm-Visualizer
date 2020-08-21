var canvas = null;
var context = null;
var workingCanvas = null;
var workingContext = null;
var imageData = null;
var instance = null;

class PolygonImage {
    constructor() {
        // generate a random dna
        this.genome = [];
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
        this.draw(workingContext);
    }

    draw(ctx) {
        // draw polygons onto offscreen canvas to obtain image data
        let width = workingCanvas.width;
        let height = workingCanvas.height;
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
function similarity(imageData1, imageData2) {
    // loop through each pixel in both images
    let data1 = imageData1.data;
    let data2 = imageData2.data;
    let ssq = 0;
    for (let i = 0; i < data1.length; i++) {
        ssq += (data1[i] - data2[i])**2;
    }

    return 1 - ssq / (data1.length * 256 * 256);
}

function evaluate(population) {
    let best = population[0];
    population.forEach(function(image) {
        image.fitness = 1 - SSD(imageData, image.imageData);
        if (image.fitness > best.getFitness()) {
            best = image;
        }
    });
    //context.drawImage(best.canvas,0,0);
}

function init() {
    // initialize population
    let population = [];
    let populationSize = 50;
    for (let i = 0; i < populationSize; i++) {
        population.push(new PolygonImage(imageData.width, imageData.height));
    }

    instance = {
        generation: 1,
        population: population,
        populationSize: populationSize,
        selectionMethod: "RWS",
        crossoverMethod: "TPC",
        crossoverRate: 0.8,
        mutationMethod: "randomResetting",
        mutationRate: 0.01,
        elitesToKeep: 1,
        pause: true
    }
}

function newGeneration() {
    // get parents
    let selectionMethod = instance.selectionMethod;
    let mutationRate = instance.mutationRate;
    let crossoverMethod = instance.crossoverMethod;
    let crossoverRate = instance.crossoverRate;
    let elitesToKeep = instance.elitesToKeep;
    let population = instance.population;

    population.sort((a, b) => a.fitness > b.fitness ? -1 : 1);
    let genomes = [population[0].genome];

    let parent1 = _.cloneDeep(population[0].genome);
    let parent2 = _.cloneDeep(population[1].genome);

    for (var i = genomes.length; i < instance.populationSize; i++) {
        // let parents = [];
        // switch (selectionMethod) {
        //     case "RWS":
        //         parents = RWS(population, 2);
        //         break;
        //     case "SUS":
        //         parents = SUS(population, 2);
        //         break;
        //     case "TOS":
        //         parents = TOS(population, 2, 8);
        //         break;
        // }

        // let offspring = null;
        // switch (crossoverMethod) {
        //     case "SPC":
        //         offspring = SPC(parent1, parent2, crossoverRate);
        //         break;
        //     case "TPC":
        //         offspring = TPC(parent1, parent2, crossoverRate);
        //         break;
        // }
        offspring = UC(parent1, parent2, crossoverRate, 10);
        gaussianMutation(offspring, mutationRate);

        genomes.push(offspring);
    }

    for(let i = 0; i < population.length; i++) {
        population[i].genome = genomes[i];
        population[i].draw(workingContext);
    }
    
}

function iterate() {
    // evaluate the population
    let population = instance.population;
    let best = population[0];
    let average = 0;
    for (let i = 0; i < population.length; i++) {
        let fitness = similarity(imageData, population[i].imageData);
        average += fitness;
        population[i].fitness = fitness;
        if (fitness > best.fitness) {
            best = population[i];
        }
    }
    best.draw(context);
    average = average / instance.populationSize;
    // updateStatistics(population, instance.generation++, true);

    // update the text for current generation
    $("#current-stat").html("Generation: " + instance.generation++ + "<br>Best Fitness: " + best.fitness + "<br>Average Fitness: " + average);
    newGeneration();
}

function run() {
    
    updateStatistics(instance.population, instance.generation++, true);
    newGeneration();
    if(instance.generation < 4000) 
        setTimeout(function() {
            run();
        }, 0);
}

$(document).ready(function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    $(".form-control-range").on('input', function(evt) {
        let formGroup = $(evt.target).closest("div.form-group");
        $(formGroup).find("p.slider-value").text(evt.target.value);
    });

    document.getElementById('file-selector').onchange = function (evt) {
        var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

        // FileReader support
        if (FileReader && files && files.length) {
            var fr = new FileReader();
            fr.onload = function () {
                let img = document.getElementById("image");
                
                img.onload = function () {
                    let img = document.getElementById("image");
                    canvas.width = img.width;
                    canvas.height = img.height;

                    workingCanvas = new OffscreenCanvas(img.width, img.height);
                    workingContext = workingCanvas.getContext('2d');

                    let m = new OffscreenCanvas(img.width, img.height);
                    let c = m.getContext('2d');
                    c.drawImage(img, 0,0);
                    imageData = c.getImageData(0,0,img.width, img.height)

                    let test = new PolygonImage();
                    test.draw(context);
                    
                    init();
                    //iterate();
                    setInterval(iterate, 0);
                    // init();
                    // run();
                    // for(let i = 0; i < 10; i++) {
                    //     evaluate(instance.population);
                    //     updateStatistics(instance.population, generation++);
                    //     newGeneration();
                    // }
                    
                }

                img.src = fr.result;

                
            }
            fr.readAsDataURL(files[0]);
        }

        
    }
});


