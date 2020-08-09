var canvas = null;
var context = null;
var imageData = null;
var instance = null;
var generation = null;

class Polygon {
    constructor(width, height) {
        this.vertices = [];
        this.width = width;
        this.height = height;
        this.randomize();
    }

    randomize() {
        // randomize color
        let r = Math.round(Math.random() * 255);
        let g = Math.round(Math.random() * 255);
        let b = Math.round(Math.random() * 255);
        let a = Math.random();
        this.rgba = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
        // randomize shape
        for(let i = 0; i < 10; i++) {
            let x = (Math.random() * (this.width + 40)) - 20;
            let y = (Math.random() * (this.height + 40)) - 20;
            this.vertices.push({x: x, y: y});
        }
    }
}

class PolygonImage {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.fitness = 0;
        
        // generate list of polygons
        let polygons = [];
        let size = 100;
        for(let i = 0; i < size; i++) {
            polygons.push(new Polygon(width, height));
        }

        this.setPolygons(polygons);
    }

    getFitness() {
        return this.fitness;
    }

    setPolygons(polygons) {
        // setup offscreen canvas
        this.canvas = new OffscreenCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext("2d");

        // draw the polygons onto the offscreen canvas
        for(let i = 0; i < polygons.length; i++) {
            let vertices = polygons[i].vertices;
            this.ctx.fillStyle = polygons[i].rgba;
            this.ctx.beginPath();
            this.ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j++) {
                this.ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            this.ctx.lineTo(vertices[0].x, vertices[0].y);
            this.ctx.fill();
        }

        this.polygons = polygons;
    } 

    getImageData() {
        return this.ctx.getImageData(0,0, this.width, this.height);
    }
}

// Calculate the normalized sum square difference between 2 images
function SSD(imageData1, imageData2) {
    // loop through each pixel in both images
    let data1 = imageData1.data;
    let data2 = imageData2.data;
    let ssq = 0;
    let sumImg1 = 0;
    let sumImg2 = 0;
    for (let i = 0; i < data1.length; i++) {
        ssq += (data1[i] - data2[i])**2
        sumImg1 += data1[i]**2
        sumImg2 += data2[i]**2
    }

    return ssq / Math.sqrt(sumImg1 * sumImg2);
}

function evaluate(population) {
    population.forEach(function(image) {
        image.fitness = 1 - SSD(imageData, image.getImageData());
    });
}

function init() {
    // initialize population
    let population = [];
    let populationSize = 100;
    for (let i = 0; i < populationSize; i++) {
        population.push(new PolygonImage(imageData.width, imageData.height));
    }

    generation = 1;

    instance = {
        population: population,
        populationSize: populationSize,
        selectionMethod: "RWS",
        crossoverMethod: "TPC",
        crossoverRate: 0.8,
        mutationMethod: "randomResetting",
        mutationRate: 0.1,
        elitesToKeep: 5,
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

    let genomes = null;
    if (elitesToKeep > 0) {
        population.sort((a, b) => a.getFitness() > b.getFitness() ? -1 : 1);
        genomes = population.slice(0, elitesToKeep).map((v) => v.polygons);
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
        let parent1 = _.cloneDeep(parents[0].polygons);
        let parent2 = _.cloneDeep(parents[1].polygons);
        switch (crossoverMethod) {
            case "SPC":
                offspring = SPC(parent1, parent2, crossoverRate);
                break;
            case "TPC":
                offspring = TPC(parent1, parent2, crossoverRate);
                break;
        }
        
        randomResetting(offspring, mutationRate);

        genomes.push(offspring);
    }

    for(let i = 0; i < population.length; i++) {
        population[i].setPolygons(genomes[i]);
    }
}

$(document).ready(function() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("bitmaprenderer");

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
                    console.log(img.width)
                    let a = new PolygonImage(img.width, img.height);

                    let m = new OffscreenCanvas(img.width, img.height);
                    let c = m.getContext('2d');
                    c.drawImage(img, 0,0);

                    imageData = c.getImageData(0,0,img.width, img.height)

                    console.log(c.getImageData(0,0,img.width, img.height));

                    console.log(SSD(a.getImageData(), c.getImageData(0,0,img.width, img.height)));
                    context.transferFromImageBitmap(a.canvas.transferToImageBitmap());

                    init();
                    for(let i = 0; i < 10; i++) {
                        evaluate(instance.population);
                        updateStatistics(instance.population, generation++);
                        newGeneration();
                    }
                }

                img.src = fr.result;

                
            }
            fr.readAsDataURL(files[0]);
        }

        
    }
});


